#!/usr/bin/env python3
"""Verify an experiment closure contract and receipt without third-party packages."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple


STATUSES = {"PASS", "FAIL", "UNVERIFIED"}
CLOSURE_STATUSES = {"CLOSED", "INVALID", "UNVERIFIED"}
SHA256_LENGTH = 64


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path, label: str, errors: List[str]) -> Optional[Dict[str, Any]]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"{label} not found: {path}")
        return None
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        errors.append(f"cannot read {label} {path}: {exc}")
        return None
    if not isinstance(value, dict):
        errors.append(f"{label} must contain one JSON object")
        return None
    return value


def resolve_path(raw: Any, base: Path, field: str, errors: List[str]) -> Optional[Path]:
    if not isinstance(raw, str) or not raw.strip():
        errors.append(f"{field} must be a non-empty path string")
        return None
    path = Path(raw).expanduser()
    if not path.is_absolute():
        path = base / path
    return path.resolve()


def is_sha256(value: Any) -> bool:
    if not isinstance(value, str) or len(value) != SHA256_LENGTH:
        return False
    return all(character in "0123456789abcdef" for character in value)


def verify_file_reference(
    reference: Any,
    base: Path,
    field: str,
    errors: List[str],
) -> Tuple[Optional[Path], Optional[str]]:
    if not isinstance(reference, dict):
        errors.append(f"{field} must be an object with path and sha256")
        return None, None
    path = resolve_path(reference.get("path"), base, f"{field}.path", errors)
    expected = reference.get("sha256")
    if not is_sha256(expected):
        errors.append(f"{field}.sha256 must be a lowercase SHA-256 digest")
    if path is None or not is_sha256(expected):
        return path, None
    if not path.is_file():
        errors.append(f"{field} not found or not a file: {path}")
        return path, None
    try:
        actual = sha256_file(path)
    except OSError as exc:
        errors.append(f"cannot hash {field} {path}: {exc}")
        return path, None
    if actual != expected:
        errors.append(f"{field} hash mismatch: expected {expected}, observed {actual}")
    return path, actual


def unique_string_list(value: Any, field: str, errors: List[str]) -> List[str]:
    if not isinstance(value, list) or not value:
        errors.append(f"{field} must be a non-empty array")
        return []
    result: List[str] = []
    for index, item in enumerate(value):
        if not isinstance(item, str) or not item:
            errors.append(f"{field}[{index}] must be a non-empty string")
            continue
        result.append(item)
    duplicates = sorted({item for item in result if result.count(item) > 1})
    if duplicates:
        errors.append(f"{field} contains duplicate IDs: {', '.join(duplicates)}")
    return result


def index_records(value: Any, field: str, errors: List[str]) -> Dict[str, Dict[str, Any]]:
    if not isinstance(value, list):
        errors.append(f"{field} must be an array")
        return {}
    indexed: Dict[str, Dict[str, Any]] = {}
    for index, record in enumerate(value):
        if not isinstance(record, dict):
            errors.append(f"{field}[{index}] must be an object")
            continue
        record_id = record.get("id")
        if not isinstance(record_id, str) or not record_id:
            errors.append(f"{field}[{index}].id must be a non-empty string")
            continue
        if record_id in indexed:
            errors.append(f"{field} contains duplicate ID: {record_id}")
            continue
        indexed[record_id] = record
    return indexed


def compare_required_ids(
    expected: Sequence[str],
    observed: Sequence[str],
    field: str,
    errors: List[str],
    allow_extra: bool = False,
) -> None:
    expected_set = set(expected)
    observed_set = set(observed)
    missing = sorted(expected_set - observed_set)
    extra = sorted(observed_set - expected_set)
    if missing:
        errors.append(f"missing required {field}: {', '.join(missing)}")
    if extra and not allow_extra:
        errors.append(f"unexpected {field}: {', '.join(extra)}")


def verify_artifacts(
    artifacts: Dict[str, Dict[str, Any]],
    receipt_dir: Path,
    errors: List[str],
) -> Dict[str, Path]:
    resolved: Dict[str, Path] = {}
    for artifact_id, artifact in artifacts.items():
        path, _ = verify_file_reference(
            {"path": artifact.get("path"), "sha256": artifact.get("sha256")},
            receipt_dir,
            f"artifact {artifact_id}",
            errors,
        )
        if path is not None:
            resolved[artifact_id] = path
    return resolved


def verify_claims(
    claims: Dict[str, Dict[str, Any]],
    required_claims: Sequence[str],
    final_subject_identity: str,
    closure_status: Any,
    errors: List[str],
) -> None:
    compare_required_ids(required_claims, list(claims), "claim IDs", errors)
    for claim_id, claim in claims.items():
        status = claim.get("status")
        evidence_identity = claim.get("evidence_subject_identity")
        reason = claim.get("reason")
        if status not in STATUSES:
            errors.append(f"claim {claim_id}.status must be PASS, FAIL, or UNVERIFIED")
        if not isinstance(evidence_identity, str) or not evidence_identity:
            errors.append(f"claim {claim_id}.evidence_subject_identity must be non-empty")
        if not isinstance(reason, str) or not reason:
            errors.append(f"claim {claim_id}.reason must be non-empty")
        if closure_status == "CLOSED":
            if status != "PASS":
                errors.append(f"CLOSED requires claim {claim_id} to be PASS, observed {status}")
            if evidence_identity != final_subject_identity:
                errors.append(
                    f"claim {claim_id} subject identity mismatch: "
                    f"expected {final_subject_identity}, observed {evidence_identity}"
                )


def verify_attempts(
    attempts: Dict[str, Dict[str, Any]],
    artifact_ids: Sequence[str],
    errors: List[str],
) -> None:
    if not attempts:
        errors.append("attempts must contain at least one retained attempt")
        return
    known_artifacts = set(artifact_ids)
    for attempt_id, attempt in attempts.items():
        exit_code = attempt.get("exit_code")
        if not isinstance(exit_code, int) or isinstance(exit_code, bool):
            errors.append(f"attempt {attempt_id}.exit_code must be an integer")
        refs = attempt.get("artifact_ids")
        if not isinstance(refs, list):
            errors.append(f"attempt {attempt_id}.artifact_ids must be an array")
            continue
        for index, artifact_id in enumerate(refs):
            if not isinstance(artifact_id, str) or not artifact_id:
                errors.append(f"attempt {attempt_id}.artifact_ids[{index}] must be non-empty")
            elif artifact_id not in known_artifacts:
                errors.append(f"attempt {attempt_id} references unknown artifact: {artifact_id}")


def run_recomputation(
    specification: Any,
    contract_dir: Path,
    artifact_paths: Dict[str, Path],
    timeout: int,
    errors: List[str],
) -> Optional[str]:
    if not isinstance(specification, dict):
        errors.append("contract.recomputation must be an object when --run-recomputation is used")
        return None
    argv = specification.get("argv")
    if (
        not isinstance(argv, list)
        or not argv
        or any(not isinstance(item, str) or not item for item in argv)
    ):
        errors.append("contract.recomputation.argv must be a non-empty string array")
        return None
    cwd = resolve_path(specification.get("cwd", "."), contract_dir, "contract.recomputation.cwd", errors)
    expected_exit = specification.get("expected_exit_code", 0)
    if not isinstance(expected_exit, int) or isinstance(expected_exit, bool):
        errors.append("contract.recomputation.expected_exit_code must be an integer")
        return None
    output_artifact_id = specification.get("output_artifact_id")
    if not isinstance(output_artifact_id, str) or not output_artifact_id:
        errors.append("contract.recomputation.output_artifact_id must be non-empty")
        return None
    output_path = artifact_paths.get(output_artifact_id)
    if output_path is None:
        errors.append(f"recomputation output artifact is unavailable: {output_artifact_id}")
        return None
    if cwd is None or not cwd.is_dir():
        errors.append(f"recomputation cwd not found or not a directory: {cwd}")
        return None
    try:
        completed = subprocess.run(
            argv,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=timeout,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        errors.append(f"recomputation could not run: {exc}")
        return None
    if completed.returncode != expected_exit:
        errors.append(
            f"recomputation exit mismatch: expected {expected_exit}, observed {completed.returncode}"
        )
    try:
        expected_output = output_path.read_bytes()
    except OSError as exc:
        errors.append(f"cannot read recomputation output artifact {output_artifact_id}: {exc}")
        return sha256_bytes(completed.stdout)
    if completed.stdout != expected_output:
        errors.append(f"recomputation output mismatch for artifact {output_artifact_id}")
    return sha256_bytes(completed.stdout)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(
        description="Verify a frozen experiment closeout contract and closure receipt."
    )
    result.add_argument("contract", type=Path)
    result.add_argument("receipt", type=Path)
    result.add_argument(
        "--run-recomputation",
        action="store_true",
        help="Run the contract's argv without a shell and compare stdout byte-for-byte.",
    )
    result.add_argument(
        "--require-closed",
        action="store_true",
        help="Also fail unless the truthful closure status is CLOSED.",
    )
    result.add_argument(
        "--expected-contract-sha256",
        help="Contract identity frozen outside the receipt, such as in preregistration.",
    )
    result.add_argument("--timeout", type=int, default=120)
    return result


def main() -> int:
    args = parser().parse_args()
    errors: List[str] = []
    contract_path = args.contract.expanduser().resolve()
    receipt_path = args.receipt.expanduser().resolve()
    contract = load_json(contract_path, "contract", errors)
    receipt = load_json(receipt_path, "receipt", errors)
    if contract is None or receipt is None:
        print(json.dumps({"verdict": "FAIL", "errors": errors}, indent=2))
        return 1

    if contract.get("schema_version") != 1:
        errors.append("contract.schema_version must be 1")
    if receipt.get("schema_version") != 1:
        errors.append("receipt.schema_version must be 1")

    verify_file_reference(contract.get("protocol"), contract_path.parent, "protocol", errors)
    receipt_contract_path, receipt_contract_hash = verify_file_reference(
        receipt.get("contract"), receipt_path.parent, "contract reference", errors
    )
    if receipt_contract_path is not None and receipt_contract_path != contract_path:
        errors.append(
            f"receipt contract path mismatch: expected {contract_path}, observed {receipt_contract_path}"
        )
    expected_contract_hash = args.expected_contract_sha256
    if expected_contract_hash is None:
        if args.require_closed:
            errors.append("--require-closed requires --expected-contract-sha256")
    elif not is_sha256(expected_contract_hash):
        errors.append("--expected-contract-sha256 must be a lowercase SHA-256 digest")
    elif receipt_contract_hash != expected_contract_hash:
        errors.append(
            "contract identity mismatch: "
            f"expected {expected_contract_hash}, observed {receipt_contract_hash}"
        )

    final_identity = contract.get("final_subject_identity")
    if not isinstance(final_identity, str) or not final_identity:
        errors.append("contract.final_subject_identity must be non-empty")
        final_identity = ""
    if receipt.get("final_subject_identity") != final_identity:
        errors.append(
            "receipt final subject identity mismatch: "
            f"expected {final_identity}, observed {receipt.get('final_subject_identity')}"
        )
    if not isinstance(receipt.get("run_id"), str) or not receipt.get("run_id"):
        errors.append("receipt.run_id must be non-empty")

    required_claims = unique_string_list(contract.get("required_claims"), "contract.required_claims", errors)
    required_artifacts = unique_string_list(
        contract.get("required_artifacts"), "contract.required_artifacts", errors
    )
    requires_primary = contract.get("requires_primary_outcome")
    if not isinstance(requires_primary, bool):
        errors.append("contract.requires_primary_outcome must be boolean")
        requires_primary = True

    closure_status = receipt.get("closure_status")
    if closure_status not in CLOSURE_STATUSES:
        errors.append("receipt.closure_status must be CLOSED, INVALID, or UNVERIFIED")

    claims = index_records(receipt.get("claims"), "receipt.claims", errors)
    artifacts = index_records(receipt.get("artifacts"), "receipt.artifacts", errors)
    attempts = index_records(receipt.get("attempts"), "receipt.attempts", errors)
    compare_required_ids(
        required_artifacts,
        list(artifacts),
        "artifact IDs",
        errors,
        allow_extra=True,
    )
    verify_claims(claims, required_claims, final_identity, closure_status, errors)
    artifact_paths = verify_artifacts(artifacts, receipt_path.parent, errors)
    verify_attempts(attempts, list(artifacts), errors)

    deviations = receipt.get("deviations")
    if not isinstance(deviations, list) or any(not isinstance(item, str) for item in deviations):
        errors.append("receipt.deviations must be a string array")
        deviations = []
    if closure_status == "INVALID" and not deviations:
        errors.append("INVALID requires at least one recorded deviation")
    if closure_status == "CLOSED" and requires_primary and receipt.get("primary_outcome") is None:
        errors.append("CLOSED requires a primary_outcome under this contract")
    if "primary_outcome" not in receipt:
        errors.append("receipt.primary_outcome is required; use null when not entitled")
    elif closure_status in {"INVALID", "UNVERIFIED"} and receipt.get("primary_outcome") is not None:
        errors.append(f"{closure_status} requires primary_outcome to be null")
    if args.require_closed and closure_status != "CLOSED":
        errors.append(f"--require-closed expected CLOSED, observed {closure_status}")

    recomputation_hash: Optional[str] = None
    recomputation_state = "NOT_RUN"
    if args.run_recomputation:
        if errors:
            recomputation_state = "BLOCKED"
        elif closure_status != "CLOSED":
            recomputation_state = "NOT_RUN"
        else:
            before = len(errors)
            recomputation_hash = run_recomputation(
                contract.get("recomputation"),
                contract_path.parent,
                artifact_paths,
                args.timeout,
                errors,
            )
            verify_artifacts(artifacts, receipt_path.parent, errors)
            recomputation_state = "PASS" if len(errors) == before else "FAIL"

    result = {
        "verdict": "PASS" if not errors else "FAIL",
        "closure_status": closure_status,
        "contract_sha256": receipt_contract_hash,
        "expected_contract_sha256": expected_contract_hash,
        "checked_claims": sorted(claims),
        "checked_artifacts": sorted(artifacts),
        "recomputation": recomputation_state,
        "recomputed_output_sha256": recomputation_hash,
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
