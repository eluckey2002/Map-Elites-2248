# RESULT-0082 — frozen policy target-race confirmation

Path A completed with primary outcome **SUPPORTED**.
The candidate remains provisional; scientific acceptance and adoption require a separate owner decision.

## Registration and scope

Protocol committed before F at f301e1925c13f4e0ec5b4fd4c23a0989a3009630.
Continuation registered at cd7741d87ae722206b0d70f388fd5602e76d6215, retaining
original e76f3ec4af2496495697322851bafca0ab73b253 and previous d2025dbfb33d7f9f51647547ac13ec7d618fcbff.
Both interrupted runs remain UNVERIFIED. All charges, including unknown lost games, remain carried.
The actual selection was P09, with policy:

```json
{
  "kind": "lab",
  "params": {
    "width": 48
  }
}
```

All 58 levels and 150 identical seeds per arm yield 8700 paired cells and 17400 confirmation games.
Games stop at target. Speed uses mutual wins; reliability includes every pair.
Historical/exploration data selected the policy and do not count as F evidence.

## C1 — negative control

PASS. Frozen inherited champion/base/variant parity and inert ordered choices were independently rechecked before F:

```json
{
  "parity": [
    {
      "policy": "champion",
      "identical": 200,
      "total": 200
    },
    {
      "policy": "base",
      "identical": 200,
      "total": 200
    },
    {
      "policy": "variant",
      "identical": 200,
      "total": 200
    }
  ],
  "inert": {
    "identical": 7858,
    "total": 7858
  }
}
```

## C2 — planted positive and zero controls

PASS. All twelve disjoint blocks completed; C1–C11 are retained and C12 is the fresh replacement.
The unchanged zero/handicap admission bars were met. Twelve blocks are a sanity check, not false-positive calibration.

```json
{
  "zeroAccepted": 1,
  "zeroCeiling": 1,
  "strongDetected": 12,
  "strongTotal": 12,
  "strongRequired": 0.8,
  "mildDetected": 7,
  "zeroMdes": [
    {
      "block": "C1",
      "se": 0.17761557492612856,
      "smallestDetectableGain80": 0.4973236097931599
    },
    {
      "block": "C2",
      "se": 0.1081578654064538,
      "smallestDetectableGain80": 0.3028420231380706
    },
    {
      "block": "C3",
      "se": 0.10003962960867781,
      "smallestDetectableGain80": 0.2801109629042978
    },
    {
      "block": "C4",
      "se": 0.11910851886363265,
      "smallestDetectableGain80": 0.3335038528181714
    },
    {
      "block": "C5",
      "se": 0.1485225696538318,
      "smallestDetectableGain80": 0.415863195030729
    },
    {
      "block": "C6",
      "se": 0.14714985061145275,
      "smallestDetectableGain80": 0.41201958171206765
    },
    {
      "block": "C7",
      "se": 0.09751653304107905,
      "smallestDetectableGain80": 0.2730462925150213
    },
    {
      "block": "C8",
      "se": 0.09695897054151804,
      "smallestDetectableGain80": 0.2714851175162505
    },
    {
      "block": "C9",
      "se": 0.13913094622807062,
      "smallestDetectableGain80": 0.3895666494385977
    },
    {
      "block": "C10",
      "se": 0.1093584788636481,
      "smallestDetectableGain80": 0.30620374081821466
    },
    {
      "block": "C11",
      "se": 0.08771892893295427,
      "smallestDetectableGain80": 0.24561300101227193
    },
    {
      "block": "C12",
      "se": 0.10487404506284667,
      "smallestDetectableGain80": 0.29364732617597067
    }
  ],
  "historicalMde": 0.22953479009586256,
  "zeroMde": 0.4973236097931599,
  "reportedDetectableGain": 0.4973236097931599
}
```

```jsonl
{"block":"C1","zero":{"cells":580,"winsGained":1,"winsLost":1,"netWins":0,"bothWin":578,"bothLose":0,"candidateFaster":206,"championFaster":232,"sameSpeed":140,"winRateDifference":0,"winSe":0.002570193077585965,"winSeLevel":0.0024595948397164095,"winSeSeed":0.002570193077585965,"winCi95":[-0.005037578432068491,0.005037578432068491],"meanMovesSaved":-0.18339100346020762,"moveSe":0.17761557492612856,"moveSeLevel":0.10388222784224163,"moveSeSeed":0.17761557492612856,"moveCi95":[-0.5315175303154196,0.16473552339500433],"mutualWins":578,"relativeMovesPct":-1.3393985342431134},"mild":{"cells":580,"winsGained":0,"winsLost":0,"netWins":0,"bothWin":579,"bothLose":1,"candidateFaster":129,"championFaster":171,"sameSpeed":279,"winRateDifference":0,"winSe":0,"winSeLevel":0,"winSeSeed":0,"winCi95":[0,0],"meanMovesSaved":-0.07944732297063903,"moveSe":0.06786171174569458,"moveSeLevel":0.04510396477461358,"moveSeSeed":0.06786171174569458,"moveCi95":[-0.2124562779922004,0.05356163205092235],"mutualWins":579,"relativeMovesPct":-0.5794910556815318},"strong":{"cells":580,"winsGained":1,"winsLost":0,"netWins":1,"bothWin":579,"bothLose":0,"candidateFaster":182,"championFaster":245,"sameSpeed":152,"winRateDifference":0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344827,"winCi95":[-0.0016551724137931034,0.005103448275862069],"meanMovesSaved":-0.33678756476683935,"moveSe":0.1285585031822028,"moveSeLevel":0.07165299553152531,"moveSeSeed":0.1285585031822028,"moveCi95":[-0.5887622310039569,-0.08481289852972185],"mutualWins":579,"relativeMovesPct":-2.456538170823885}}
{"block":"C2","zero":{"cells":580,"winsGained":1,"winsLost":2,"netWins":-1,"bothWin":577,"bothLose":0,"candidateFaster":199,"championFaster":231,"sameSpeed":147,"winRateDifference":-0.0017241379310344827,"winSe":0.0030037074392809055,"winSeLevel":0.0030037074392809055,"winSeSeed":0.0017241379310344827,"winCi95":[-0.007611404512025057,0.004163128649956092],"meanMovesSaved":-0.14211438474870017,"moveSe":0.1081578654064538,"moveSeLevel":0.1081578654064538,"moveSeSeed":0.049280674784176366,"moveCi95":[-0.3541038009453496,0.06987503144794927],"mutualWins":577,"relativeMovesPct":-1.0370557733653725},"mild":{"cells":580,"winsGained":0,"winsLost":1,"netWins":-1,"bothWin":578,"bothLose":1,"candidateFaster":112,"championFaster":183,"sameSpeed":283,"winRateDifference":-0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344827,"winCi95":[-0.005103448275862069,0.0016551724137931034],"meanMovesSaved":-0.19204152249134948,"moveSe":0.06483786067276735,"moveSeLevel":0.04775945741719763,"moveSeSeed":0.06483786067276735,"moveCi95":[-0.31912372940997347,-0.06495931557272547],"mutualWins":578,"relativeMovesPct":-1.4009844755774328},"strong":{"cells":580,"winsGained":0,"winsLost":1,"netWins":-1,"bothWin":578,"bothLose":1,"candidateFaster":152,"championFaster":253,"sameSpeed":173,"winRateDifference":-0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344825,"winCi95":[-0.005103448275862069,0.0016551724137931034],"meanMovesSaved":-0.4429065743944637,"moveSe":0.13429074110008463,"moveSeLevel":0.08763438011631179,"moveSeSeed":0.13429074110008463,"moveCi95":[-0.7061164269506295,-0.17969672183829782],"mutualWins":578,"relativeMovesPct":-3.2298763562957356}}
{"block":"C3","zero":{"cells":580,"winsGained":2,"winsLost":0,"netWins":2,"bothWin":578,"bothLose":0,"candidateFaster":211,"championFaster":220,"sameSpeed":147,"winRateDifference":0.0034482758620689655,"winSe":0.003448275862068965,"winSeLevel":0.0024168160139671118,"winSeSeed":0.003448275862068965,"winCi95":[-0.003310344827586206,0.010206896551724137],"meanMovesSaved":-0.025951557093425604,"moveSe":0.10003962960867781,"moveSeLevel":0.05814432459182427,"moveSeSeed":0.10003962960867781,"moveCi95":[-0.2220292311264341,0.17012611693958288],"mutualWins":578,"relativeMovesPct":-0.18649757553151808},"mild":{"cells":580,"winsGained":2,"winsLost":0,"netWins":2,"bothWin":578,"bothLose":0,"candidateFaster":141,"championFaster":154,"sameSpeed":283,"winRateDifference":0.0034482758620689655,"winSe":0.003448275862068965,"winSeLevel":0.0024168160139671118,"winSeSeed":0.003448275862068965,"winCi95":[-0.003310344827586206,0.010206896551724137],"meanMovesSaved":0.01730103806228374,"moveSe":0.06307294928703727,"moveSeLevel":0.06085243337936239,"moveSeSeed":0.06307294928703727,"moveCi95":[-0.10632194254030931,0.1409240186648768],"mutualWins":578,"relativeMovesPct":0.12433171702101208},"strong":{"cells":580,"winsGained":2,"winsLost":0,"netWins":2,"bothWin":578,"bothLose":0,"candidateFaster":156,"championFaster":239,"sameSpeed":183,"winRateDifference":0.0034482758620689655,"winSe":0.003448275862068965,"winSeLevel":0.0024168160139671118,"winSeSeed":0.003448275862068965,"winCi95":[-0.003310344827586206,0.010206896551724137],"meanMovesSaved":-0.3408304498269896,"moveSe":0.14353771137906793,"moveSeLevel":0.0786678454452634,"moveSeSeed":0.14353771137906793,"moveCi95":[-0.6221643641299628,-0.059496535524016514],"mutualWins":578,"relativeMovesPct":-2.449334825313938}}
{"block":"C4","zero":{"cells":580,"winsGained":3,"winsLost":2,"netWins":1,"bothWin":575,"bothLose":0,"candidateFaster":220,"championFaster":230,"sameSpeed":125,"winRateDifference":0.0017241379310344827,"winSe":0.003094922302950864,"winSeLevel":0.0030037074392809055,"winSeSeed":0.003094922302950864,"winCi95":[-0.004341909782749211,0.007790185644818176],"meanMovesSaved":0.08695652173913043,"moveSe":0.11910851886363265,"moveSeLevel":0.11910851886363265,"moveSeSeed":0.09461240732305903,"moveCi95":[-0.14649617523358954,0.3204092187118504],"mutualWins":575,"relativeMovesPct":0.6282985674792662},"mild":{"cells":580,"winsGained":3,"winsLost":2,"netWins":1,"bothWin":575,"bothLose":0,"candidateFaster":115,"championFaster":159,"sameSpeed":301,"winRateDifference":0.0017241379310344827,"winSe":0.0030949223029508644,"winSeLevel":0.0030037074392809055,"winSeSeed":0.0030949223029508644,"winCi95":[-0.0043419097827492115,0.007790185644818177],"meanMovesSaved":-0.11130434782608696,"moveSe":0.06370166790975408,"moveSeLevel":0.05704037909325782,"moveSeSeed":0.06370166790975408,"moveCi95":[-0.23615961692920495,0.01355092127703103],"mutualWins":575,"relativeMovesPct":-0.8049301974594391},"strong":{"cells":580,"winsGained":3,"winsLost":2,"netWins":1,"bothWin":575,"bothLose":0,"candidateFaster":188,"championFaster":250,"sameSpeed":137,"winRateDifference":0.0017241379310344827,"winSe":0.0038822500120871974,"winSeLevel":0.0038822500120871974,"winSeSeed":0.003094922302950864,"winCi95":[-0.005885072092656424,0.00933334795472539],"meanMovesSaved":-0.21739130434782608,"moveSe":0.09271727888299378,"moveSeLevel":0.09271727888299378,"moveSeSeed":0.08713253470426591,"moveCi95":[-0.39911717095849386,-0.03566543773715827],"mutualWins":575,"relativeMovesPct":-1.57035175879397}}
{"block":"C5","zero":{"cells":580,"winsGained":1,"winsLost":1,"netWins":0,"bothWin":578,"bothLose":0,"candidateFaster":214,"championFaster":233,"sameSpeed":131,"winRateDifference":0,"winSe":0.002570193077585965,"winSeLevel":0,"winSeSeed":0.002570193077585965,"winCi95":[-0.005037578432068491,0.005037578432068491],"meanMovesSaved":-0.03806228373702422,"moveSe":0.1485225696538318,"moveSeLevel":0.0921731723389275,"moveSeSeed":0.1485225696538318,"moveCi95":[-0.32916652025853455,0.25304195278448605],"mutualWins":578,"relativeMovesPct":-0.27393848835761425},"mild":{"cells":580,"winsGained":1,"winsLost":2,"netWins":-1,"bothWin":577,"bothLose":0,"candidateFaster":109,"championFaster":164,"sameSpeed":304,"winRateDifference":-0.0017241379310344827,"winSe":0.003094922302950864,"winSeLevel":0.0017241379310344827,"winSeSeed":0.003094922302950864,"winCi95":[-0.007790185644818176,0.004341909782749211],"meanMovesSaved":-0.14211438474870017,"moveSe":0.06360229739463308,"moveSeLevel":0.04282121052441811,"moveSeSeed":0.06360229739463308,"moveCi95":[-0.266774887642181,-0.01745388185521933],"mutualWins":577,"relativeMovesPct":-1.023592560229684},"strong":{"cells":580,"winsGained":1,"winsLost":2,"netWins":-1,"bothWin":577,"bothLose":0,"candidateFaster":158,"championFaster":265,"sameSpeed":154,"winRateDifference":-0.0017241379310344827,"winSe":0.0038822500120871974,"winSeLevel":0.0038822500120871974,"winSeSeed":0.003094922302950864,"winCi95":[-0.00933334795472539,0.005885072092656424],"meanMovesSaved":-0.4072790294627383,"moveSe":0.11495033856572465,"moveSeLevel":0.08148530083509498,"moveSeSeed":0.11495033856572465,"moveCi95":[-0.6325816930515586,-0.181976365873918],"mutualWins":577,"relativeMovesPct":-2.9294440289204684}}
{"block":"C6","zero":{"cells":580,"winsGained":2,"winsLost":3,"netWins":-1,"bothWin":574,"bothLose":1,"candidateFaster":216,"championFaster":205,"sameSpeed":153,"winRateDifference":-0.0017241379310344827,"winSe":0.0040229885057471255,"winSeLevel":0.0038822500120871974,"winSeSeed":0.0040229885057471255,"winCi95":[-0.009609195402298848,0.0061609195402298825],"meanMovesSaved":0,"moveSe":0.14714985061145275,"moveSeLevel":0.09349130067900774,"moveSeSeed":0.14714985061145275,"moveCi95":[-0.2884137071984474,0.2884137071984474],"mutualWins":574,"relativeMovesPct":0},"mild":{"cells":580,"winsGained":1,"winsLost":2,"netWins":-1,"bothWin":575,"bothLose":2,"candidateFaster":107,"championFaster":172,"sameSpeed":296,"winRateDifference":-0.0017241379310344827,"winSe":0.003094922302950864,"winSeLevel":0.0017241379310344827,"winSeSeed":0.003094922302950864,"winCi95":[-0.007790185644818176,0.004341909782749211],"meanMovesSaved":-0.17043478260869566,"moveSe":0.06129273863729054,"moveSeLevel":0.05422524659390562,"moveSeSeed":0.06129273863729054,"moveCi95":[-0.2905685503377851,-0.0503010148796062],"mutualWins":575,"relativeMovesPct":-1.235657546337158},"strong":{"cells":580,"winsGained":3,"winsLost":3,"netWins":0,"bothWin":574,"bothLose":0,"candidateFaster":162,"championFaster":262,"sameSpeed":150,"winRateDifference":0,"winSe":0.004451704995640709,"winSeLevel":0.0024595948397164095,"winSeSeed":0.004451704995640709,"winCi95":[-0.008725341791455789,0.008725341791455789],"meanMovesSaved":-0.38501742160278746,"moveSe":0.09198933045790893,"moveSeLevel":0.08890031808645624,"moveSeSeed":0.09198933045790893,"moveCi95":[-0.565316509300289,-0.20471833390528596],"mutualWins":574,"relativeMovesPct":-2.791461412151067}}
{"block":"C7","zero":{"cells":580,"winsGained":1,"winsLost":1,"netWins":0,"bothWin":577,"bothLose":1,"candidateFaster":191,"championFaster":237,"sameSpeed":149,"winRateDifference":0,"winSe":0.002570193077585965,"winSeLevel":0,"winSeSeed":0.002570193077585965,"winCi95":[-0.005037578432068491,0.005037578432068491],"meanMovesSaved":-0.15424610051993068,"moveSe":0.09751653304107905,"moveSeLevel":0.09751653304107905,"moveSeSeed":0.09504773206483125,"moveCi95":[-0.3453785052804456,0.036886304240584256],"mutualWins":577,"relativeMovesPct":-1.1324596004580736},"mild":{"cells":580,"winsGained":0,"winsLost":1,"netWins":-1,"bothWin":577,"bothLose":2,"candidateFaster":125,"championFaster":181,"sameSpeed":271,"winRateDifference":-0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344827,"winCi95":[-0.005103448275862069,0.0016551724137931034],"meanMovesSaved":-0.17677642980935876,"moveSe":0.06361588853321647,"moveSeLevel":0.059783971632457245,"moveSeSeed":0.06361588853321647,"moveCi95":[-0.301463571334463,-0.05208928828425449],"mutualWins":577,"relativeMovesPct":-1.2975448416232032},"strong":{"cells":580,"winsGained":0,"winsLost":3,"netWins":-3,"bothWin":575,"bothLose":2,"candidateFaster":185,"championFaster":238,"sameSpeed":152,"winRateDifference":-0.005172413793103448,"winSe":0.0038281393516913175,"winSeLevel":0.0038281393516913175,"winSeSeed":0.0036799564582947406,"winCi95":[-0.01267556692241843,0.0023307393362115344],"meanMovesSaved":-0.22608695652173913,"moveSe":0.08504530715720568,"moveSeLevel":0.0793998379737808,"moveSeSeed":0.08504530715720568,"moveCi95":[-0.39277575854986224,-0.05939815449361599],"mutualWins":575,"relativeMovesPct":-1.6600689567105096}}
{"block":"C8","zero":{"cells":580,"winsGained":2,"winsLost":0,"netWins":2,"bothWin":577,"bothLose":1,"candidateFaster":251,"championFaster":201,"sameSpeed":125,"winRateDifference":0.0034482758620689655,"winSe":0.0024168160139671118,"winSeLevel":0.0024168160139671118,"winSeSeed":0.002298850574712643,"winCi95":[-0.001288683525306574,0.008185235249444506],"meanMovesSaved":0.1923743500866551,"moveSe":0.09695897054151804,"moveSeLevel":0.09695897054151804,"moveSeSeed":0.08929930779376087,"moveCi95":[0.002334767825279749,0.38241393234803045],"mutualWins":577,"relativeMovesPct":1.3978088401964488},"mild":{"cells":580,"winsGained":3,"winsLost":1,"netWins":2,"bothWin":576,"bothLose":0,"candidateFaster":122,"championFaster":175,"sameSpeed":279,"winRateDifference":0.0034482758620689655,"winSe":0.004300755616981541,"winSeLevel":0.0034482758620689655,"winSeSeed":0.004300755616981541,"winCi95":[-0.004981205147214856,0.011877756871352787],"meanMovesSaved":-0.203125,"moveSe":0.06111768504283606,"moveSeLevel":0.06111768504283606,"moveSeSeed":0.05176151343686122,"moveCi95":[-0.32291566268395866,-0.08333433731604133],"mutualWins":576,"relativeMovesPct":-1.4783927217589081},"strong":{"cells":580,"winsGained":2,"winsLost":1,"netWins":1,"bothWin":576,"bothLose":1,"candidateFaster":154,"championFaster":250,"sameSpeed":172,"winRateDifference":0.0017241379310344827,"winSe":0.0030949223029508644,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0030949223029508644,"winCi95":[-0.0043419097827492115,0.007790185644818177],"meanMovesSaved":-0.3645833333333333,"moveSe":0.08689286047035055,"moveSeLevel":0.08689286047035055,"moveSeSeed":0.08372908114411827,"moveCi95":[-0.5348933398552204,-0.19427332681144624],"mutualWins":576,"relativeMovesPct":-2.650511170011359}}
{"block":"C9","zero":{"cells":580,"winsGained":0,"winsLost":1,"netWins":-1,"bothWin":579,"bothLose":0,"candidateFaster":239,"championFaster":219,"sameSpeed":121,"winRateDifference":-0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344827,"winCi95":[-0.005103448275862069,0.0016551724137931034],"meanMovesSaved":0.05699481865284974,"moveSe":0.13913094622807062,"moveSeLevel":0.10211689845570714,"moveSeSeed":0.13913094622807062,"moveCi95":[-0.21570183595416867,0.32969147325986814],"mutualWins":579,"relativeMovesPct":0.4158266129032258},"mild":{"cells":580,"winsGained":0,"winsLost":3,"netWins":-3,"bothWin":577,"bothLose":0,"candidateFaster":129,"championFaster":165,"sameSpeed":283,"winRateDifference":-0.005172413793103448,"winSe":0.005172413793103447,"winSeLevel":0.005172413793103447,"winSeSeed":0.002633664192503356,"winCi95":[-0.015310344827586204,0.004965517241379308],"meanMovesSaved":-0.09878682842287695,"moveSe":0.06850170218280228,"moveSeLevel":0.0563783478476851,"moveSeSeed":0.06850170218280228,"moveCi95":[-0.23305016470116943,0.035476507855415534],"mutualWins":577,"relativeMovesPct":-0.722067392956676},"strong":{"cells":580,"winsGained":0,"winsLost":3,"netWins":-3,"bothWin":577,"bothLose":0,"candidateFaster":191,"championFaster":236,"sameSpeed":150,"winRateDifference":-0.005172413793103448,"winSe":0.003828139351691318,"winSeLevel":0.003828139351691318,"winSeSeed":0.0026336641925033557,"winCi95":[-0.01267556692241843,0.0023307393362115344],"meanMovesSaved":-0.21663778162911612,"moveSe":0.10562335902598927,"moveSeLevel":0.08419475348921525,"moveSeSeed":0.10562335902598927,"moveCi95":[-0.4236595653200551,-0.009615997938177162],"mutualWins":577,"relativeMovesPct":-1.583681743316863}}
{"block":"C10","zero":{"cells":580,"winsGained":1,"winsLost":0,"netWins":1,"bothWin":579,"bothLose":0,"candidateFaster":208,"championFaster":238,"sameSpeed":133,"winRateDifference":0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344825,"winCi95":[-0.0016551724137931034,0.005103448275862069],"meanMovesSaved":-0.1001727115716753,"moveSe":0.1093584788636481,"moveSeLevel":0.10014980485188203,"moveSeSeed":0.1093584788636481,"moveCi95":[-0.31451533014442556,0.11416990700107497],"mutualWins":579,"relativeMovesPct":-0.7150782887436814},"mild":{"cells":580,"winsGained":1,"winsLost":0,"netWins":1,"bothWin":579,"bothLose":0,"candidateFaster":115,"championFaster":188,"sameSpeed":276,"winRateDifference":0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344825,"winCi95":[-0.0016551724137931034,0.005103448275862069],"meanMovesSaved":-0.19343696027633853,"moveSe":0.05026445129691192,"moveSeLevel":0.04521252230863253,"moveSeSeed":0.05026445129691192,"moveCi95":[-0.2919552848182859,-0.09491863573439116],"mutualWins":579,"relativeMovesPct":-1.3808408334360747},"strong":{"cells":580,"winsGained":1,"winsLost":4,"netWins":-3,"bothWin":575,"bothLose":0,"candidateFaster":181,"championFaster":232,"sameSpeed":162,"winRateDifference":-0.005172413793103448,"winSe":0.004488649239026813,"winSeLevel":0.003828139351691318,"winSeSeed":0.004488649239026813,"winCi95":[-0.013970166301596,0.0036253387153891044],"meanMovesSaved":-0.24695652173913044,"moveSe":0.11659619518490098,"moveSeLevel":0.07521343170153412,"moveSeSeed":0.11659619518490098,"moveCi95":[-0.47548506430153636,-0.018427979176724507],"mutualWins":575,"relativeMovesPct":-1.768148424853692}}
{"block":"C11","zero":{"cells":580,"winsGained":2,"winsLost":1,"netWins":1,"bothWin":577,"bothLose":0,"candidateFaster":224,"championFaster":202,"sameSpeed":151,"winRateDifference":0.0017241379310344827,"winSe":0.0030949223029508644,"winSeLevel":0.0030037074392809055,"winSeSeed":0.0030949223029508644,"winCi95":[-0.0043419097827492115,0.007790185644818177],"meanMovesSaved":-0.008665511265164644,"moveSe":0.08771892893295427,"moveSeLevel":0.08771892893295427,"moveSeSeed":0.08754429932087349,"moveCi95":[-0.180594611973755,0.1632635894434257],"mutualWins":577,"relativeMovesPct":-0.06246096189881324},"mild":{"cells":580,"winsGained":1,"winsLost":2,"netWins":-1,"bothWin":576,"bothLose":1,"candidateFaster":126,"championFaster":172,"sameSpeed":278,"winRateDifference":-0.0017241379310344827,"winSe":0.0030949223029508644,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0030949223029508644,"winCi95":[-0.007790185644818177,0.0043419097827492115],"meanMovesSaved":-0.09722222222222222,"moveSe":0.051817918678438456,"moveSeLevel":0.051817918678438456,"moveSeSeed":0.04819981567524581,"moveCi95":[-0.1987853428319616,0.004340898387517153],"mutualWins":576,"relativeMovesPct":-0.7009638252597322},"strong":{"cells":580,"winsGained":1,"winsLost":0,"netWins":1,"bothWin":578,"bothLose":1,"candidateFaster":157,"championFaster":258,"sameSpeed":163,"winRateDifference":0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344825,"winCi95":[-0.0016551724137931034,0.005103448275862069],"meanMovesSaved":-0.45674740484429066,"moveSe":0.0659086724966292,"moveSeLevel":0.0659086724966292,"moveSeSeed":0.054068133754590915,"moveCi95":[-0.5859284029376839,-0.32756640675089743],"mutualWins":578,"relativeMovesPct":-3.2901296111665004}}
{"block":"C12","zero":{"cells":580,"winsGained":1,"winsLost":1,"netWins":0,"bothWin":578,"bothLose":0,"candidateFaster":203,"championFaster":229,"sameSpeed":146,"winRateDifference":0,"winSe":0.002570193077585965,"winSeLevel":0.0024595948397164095,"winSeSeed":0.002570193077585965,"winCi95":[-0.005037578432068491,0.005037578432068491],"meanMovesSaved":-0.17993079584775087,"moveSe":0.10487404506284667,"moveSeLevel":0.09624743394883688,"moveSeSeed":0.10487404506284667,"moveCi95":[-0.38548392417093036,0.02562233247542861],"mutualWins":578,"relativeMovesPct":-1.3146252054101886},"mild":{"cells":580,"winsGained":1,"winsLost":2,"netWins":-1,"bothWin":577,"bothLose":0,"candidateFaster":108,"championFaster":197,"sameSpeed":272,"winRateDifference":-0.0017241379310344827,"winSe":0.003094922302950864,"winSeLevel":0.0017241379310344827,"winSeSeed":0.003094922302950864,"winCi95":[-0.007790185644818176,0.004341909782749211],"meanMovesSaved":-0.19930675909878684,"moveSe":0.06780165446884073,"moveSeLevel":0.04709484097163825,"moveSeSeed":0.06780165446884073,"moveCi95":[-0.33219800185771464,-0.06641551633985901],"mutualWins":577,"relativeMovesPct":-1.4601320467242256},"strong":{"cells":580,"winsGained":0,"winsLost":1,"netWins":-1,"bothWin":578,"bothLose":1,"candidateFaster":170,"championFaster":242,"sameSpeed":166,"winRateDifference":-0.0017241379310344827,"winSe":0.0017241379310344827,"winSeLevel":0.0017241379310344827,"winSeSeed":0.0017241379310344825,"winCi95":[-0.005103448275862069,0.0016551724137931034],"meanMovesSaved":-0.28027681660899656,"moveSe":0.09349717668571579,"moveSeLevel":0.07634005473331099,"moveSeSeed":0.09349717668571579,"moveCi95":[-0.4635312829129995,-0.09702235030499362],"mutualWins":578,"relativeMovesPct":-2.0477815699658706}}
```

## C3 — current regression suite

PASS. Freshly executed full suite: {"tests":754,"pass":750,"fail":3,"skipped":1}.
The original three named failures and one skip remain. No other existing test was edited or skipped.
Actual transcript: docs/goals/policy-terms-loop/resume-result-tests.txt. The terminal closeout executes the suite again after evidence handoff.

## P1 — primary empirical prediction

SUPPORTED. The unchanged all-level win guard and two-axis 95% speed interval determine this outcome:

```json
{
  "cells": 8700,
  "winsGained": 11,
  "winsLost": 9,
  "netWins": 2,
  "bothWin": 8662,
  "bothLose": 18,
  "candidateFaster": 2518,
  "championFaster": 1411,
  "sameSpeed": 4733,
  "winRateDifference": 0.00022988505747126436,
  "winSe": 0.0004889309810004953,
  "winSeLevel": 0.00022988505747126436,
  "winSeSeed": 0.0004889309810004953,
  "winCi95": [
    -0.0007284196652897064,
    0.001188189780232235
  ],
  "meanMovesSaved": 0.2631032094204572,
  "moveSe": 0.022016152606100507,
  "moveSeLevel": 0.022016152606100507,
  "moveSeSeed": 0.017070346202119037,
  "moveCi95": [
    0.2199515503125002,
    0.30625486852841416
  ],
  "mutualWins": 8662,
  "relativeMovesPct": 1.9200148276704552
}
```

Both SE axes are reported. Adding seeds does not shrink the level-axis error.
Historical/control detectable gains are conditional contrasts, not guarantees for this candidate.
Observed lower speed endpoint: 0.2199515503125002 moves; exactly zero cannot support a gain.
Observed net-win guard headroom: 2; a negative value already fails the guard.
Secondary and per-level outcomes cannot override the primary result.

## P2 — guard against a worse system that scores better

PASS. Wins gained=11, wins lost=9, net wins=2;
mutual-win denominator=8662. No loss-adjusted speed substitution.
Any net-win decrease makes the primary FALSIFIED regardless of speed.

## P3 — compute cost

PASS: physical worker CPU and wall time were measured and reported separately.
This is not a compute-matched comparison and establishes no equal-cost gain.

```json
{
  "champion": {
    "threadCpuSeconds": 11789.582070000002,
    "wallSeconds": 3544.6791103130004
  },
  "candidate": {
    "threadCpuSeconds": 24609.50462399996,
    "wallSeconds": 6387.908131162001
  },
  "threadCpuRatio": 2.087394148315213,
  "wallRatio": 1.802111822358425,
  "cpuSecondsPerGame": {
    "champion": 1.3551243758620692,
    "candidate": 2.8286786924137886
  }
}
```

## Secondary and per-level reports

```json
{
  "secondary": {
    "late": {
      "cells": 450,
      "winsGained": 0,
      "winsLost": 0,
      "netWins": 0,
      "bothWin": 450,
      "bothLose": 0,
      "candidateFaster": 129,
      "championFaster": 87,
      "sameSpeed": 234,
      "winRateDifference": 0,
      "winSe": 0,
      "winSeLevel": 0,
      "winSeSeed": 0,
      "winCi95": [
        0,
        0
      ],
      "meanMovesSaved": 0.2088888888888889,
      "moveSe": 0.06736669507210719,
      "moveSeLevel": 0.06736669507210719,
      "moveSeSeed": 0.06126893051173547,
      "moveCi95": [
        0.07685016654755883,
        0.340927611230219
      ],
      "mutualWins": 450,
      "relativeMovesPct": 1.3388406209941603
    },
    "other": {
      "cells": 8250,
      "winsGained": 11,
      "winsLost": 9,
      "netWins": 2,
      "bothWin": 8212,
      "bothLose": 18,
      "candidateFaster": 2389,
      "championFaster": 1324,
      "sameSpeed": 4499,
      "winRateDifference": 0.00024242424242424242,
      "winSe": 0.0005155999436005213,
      "winSeLevel": 0.0002424242424242424,
      "winSeSeed": 0.0005155999436005213,
      "winCi95": [
        -0.0007681516470327794,
        0.0012530001318812641
      ],
      "meanMovesSaved": 0.2660740379931807,
      "moveSe": 0.022964219665553988,
      "moveSeLevel": 0.022964219665553988,
      "moveSeSeed": 0.017861782000919077,
      "moveCi95": [
        0.22106416744869486,
        0.3110839085376665
      ],
      "mutualWins": 8212,
      "relativeMovesPct": 1.9565528851319889
    }
  },
  "perLevel": [
    {
      "level": 1,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 0,
        "championFaster": 0,
        "sameSpeed": 150,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0
      }
    },
    {
      "level": 2,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 2,
        "championFaster": 2,
        "sameSpeed": 146,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.013378001241813023,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0
      }
    },
    {
      "level": 3,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 3,
        "championFaster": 1,
        "sameSpeed": 146,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.02,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.017621422796897653,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.3952569169960475
      }
    },
    {
      "level": 4,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 8,
        "championFaster": 1,
        "sameSpeed": 141,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.05333333333333334,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.022755714018836803,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.81799591002045
      }
    },
    {
      "level": 5,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 18,
        "championFaster": 3,
        "sameSpeed": 129,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.15333333333333332,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.04704861274493621,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.982758620689655
      }
    },
    {
      "level": 6,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 29,
        "championFaster": 4,
        "sameSpeed": 117,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.24666666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.05510751473676104,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.8593508500772797
      }
    },
    {
      "level": 7,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 27,
        "championFaster": 6,
        "sameSpeed": 117,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.22,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.05973094034835994,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.279005524861878
      }
    },
    {
      "level": 8,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 20,
        "championFaster": 9,
        "sameSpeed": 121,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.14666666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.061587257657262015,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.4157014157014158
      }
    },
    {
      "level": 9,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 25,
        "championFaster": 12,
        "sameSpeed": 113,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.18,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.07571877794400354,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.5597920277296362
      }
    },
    {
      "level": 10,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 26,
        "championFaster": 15,
        "sameSpeed": 109,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.11333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.08436453694067204,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.9325287986834886
      }
    },
    {
      "level": 11,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 56,
        "championFaster": 15,
        "sameSpeed": 79,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.42,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.08683858357501828,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.6416184971098264
      }
    },
    {
      "level": 12,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 56,
        "championFaster": 18,
        "sameSpeed": 76,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.44,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.10383259629659314,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.7078651685393256
      }
    },
    {
      "level": 13,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 59,
        "championFaster": 31,
        "sameSpeed": 60,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.43333333333333335,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11640270554551,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.466666666666667
      }
    },
    {
      "level": 14,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 59,
        "championFaster": 30,
        "sameSpeed": 61,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.4533333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11295766135487283,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.5940803382663846
      }
    },
    {
      "level": 15,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 60,
        "championFaster": 27,
        "sameSpeed": 63,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.52,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11842365082121681,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.8067349926793557
      }
    },
    {
      "level": 16,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 63,
        "championFaster": 28,
        "sameSpeed": 59,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.4666666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.12644393463317347,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.3524904214559386
      }
    },
    {
      "level": 17,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 66,
        "championFaster": 29,
        "sameSpeed": 55,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.44666666666666666,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11293785452996474,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.1425891181988743
      }
    },
    {
      "level": 18,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 54,
        "championFaster": 28,
        "sameSpeed": 68,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.42,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.12806248474865697,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.8597367226509305
      }
    },
    {
      "level": 19,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 48,
        "championFaster": 40,
        "sameSpeed": 62,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.24666666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.14219017629271594,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.6871865025079802
      }
    },
    {
      "level": 20,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 65,
        "championFaster": 24,
        "sameSpeed": 61,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.44666666666666666,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11012974518966552,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.899177845088706
      }
    },
    {
      "level": 21,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 58,
        "championFaster": 17,
        "sameSpeed": 75,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.49333333333333335,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.10857905363097185,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 4.340175953079179
      }
    },
    {
      "level": 22,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 54,
        "championFaster": 17,
        "sameSpeed": 79,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.38,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.09491312405862645,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.2890940565493367
      }
    },
    {
      "level": 23,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 62,
        "championFaster": 23,
        "sameSpeed": 65,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.47333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.10478343135701389,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.7250786988457505
      }
    },
    {
      "level": 24,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 46,
        "championFaster": 19,
        "sameSpeed": 85,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.37333333333333335,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.10599340094551656,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.012372243141474
      }
    },
    {
      "level": 25,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 58,
        "championFaster": 32,
        "sameSpeed": 60,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.24,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.12065444213603914,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.723312589755864
      }
    },
    {
      "level": 26,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 66,
        "championFaster": 46,
        "sameSpeed": 38,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.35333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.17004714878919563,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.0314296665389038
      }
    },
    {
      "level": 27,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 66,
        "championFaster": 45,
        "sameSpeed": 39,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.36666666666666664,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.1711695959398116,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.098435711560473
      }
    },
    {
      "level": 28,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 69,
        "championFaster": 30,
        "sameSpeed": 51,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.6266666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.14671546879756475,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.5140186915887854
      }
    },
    {
      "level": 29,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 74,
        "championFaster": 35,
        "sameSpeed": 41,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.6333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.16231454167747936,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 3.5003684598378775
      }
    },
    {
      "level": 30,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 53,
        "championFaster": 37,
        "sameSpeed": 60,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.3333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.1527281120546647,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.7711654268508676
      }
    },
    {
      "level": 31,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 49,
        "championFaster": 35,
        "sameSpeed": 66,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.26,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11486009386776147,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.9164619164619165
      }
    },
    {
      "level": 32,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 36,
        "championFaster": 31,
        "sameSpeed": 83,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.03333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.096199209169784,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.2491280518186348
      }
    },
    {
      "level": 33,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 40,
        "championFaster": 30,
        "sameSpeed": 80,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.08666666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.09963542790424224,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.6568974229408793
      }
    },
    {
      "level": 34,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 49,
        "championFaster": 36,
        "sameSpeed": 65,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.24,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.13232730081652466,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.606425702811245
      }
    },
    {
      "level": 35,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 23,
        "championFaster": 19,
        "sameSpeed": 108,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.05333333333333334,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.0855495024830256,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.37576326914044156
      }
    },
    {
      "level": 36,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 51,
        "championFaster": 39,
        "sameSpeed": 60,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.10666666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.1255490551530101,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.6560065600656007
      }
    },
    {
      "level": 37,
      "summary": {
        "cells": 150,
        "winsGained": 1,
        "winsLost": 0,
        "netWins": 1,
        "bothWin": 148,
        "bothLose": 1,
        "candidateFaster": 40,
        "championFaster": 21,
        "sameSpeed": 87,
        "winRateDifference": 0.006666666666666667,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0.0066666666666666515,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.3581081081081081,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.13491777886608736,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 148,
        "relativeMovesPct": 2.373488580385132
      }
    },
    {
      "level": 38,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 53,
        "championFaster": 23,
        "sameSpeed": 74,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.43333333333333335,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11446467824289644,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.6848409748038002
      }
    },
    {
      "level": 39,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 53,
        "championFaster": 24,
        "sameSpeed": 73,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.4266666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.1798201106243032,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.590044516390126
      }
    },
    {
      "level": 40,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 56,
        "championFaster": 54,
        "sameSpeed": 40,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.09333333333333334,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.17400317996185635,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.4539559014267186
      }
    },
    {
      "level": 41,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 38,
        "championFaster": 24,
        "sameSpeed": 88,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.19333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.08009874591832443,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.4956162970603404
      }
    },
    {
      "level": 42,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 62,
        "championFaster": 32,
        "sameSpeed": 56,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.37333333333333335,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11721857312371764,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.46804759806082
      }
    },
    {
      "level": 43,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 45,
        "championFaster": 24,
        "sameSpeed": 81,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.21333333333333335,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.09811953020325771,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.476695892939548
      }
    },
    {
      "level": 44,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 53,
        "championFaster": 25,
        "sameSpeed": 72,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.24,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.09491783801348594,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.4610389610389611
      }
    },
    {
      "level": 45,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 37,
        "championFaster": 24,
        "sameSpeed": 89,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.2,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.10319287560168118,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.2668918918918919
      }
    },
    {
      "level": 46,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 47,
        "championFaster": 27,
        "sameSpeed": 76,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.36,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.14540847348443559,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.164328657314629
      }
    },
    {
      "level": 47,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 149,
        "bothLose": 1,
        "candidateFaster": 36,
        "championFaster": 30,
        "sameSpeed": 83,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.20134228187919462,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.12952489112797377,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 149,
        "relativeMovesPct": 1.2096774193548387
      }
    },
    {
      "level": 48,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 148,
        "bothLose": 2,
        "candidateFaster": 34,
        "championFaster": 32,
        "sameSpeed": 82,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.16216216216216217,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.1552104343030255,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 148,
        "relativeMovesPct": 0.9419152276295133
      }
    },
    {
      "level": 49,
      "summary": {
        "cells": 150,
        "winsGained": 1,
        "winsLost": 0,
        "netWins": 1,
        "bothWin": 147,
        "bothLose": 2,
        "candidateFaster": 21,
        "championFaster": 28,
        "sameSpeed": 98,
        "winRateDifference": 0.006666666666666667,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0.006666666666666655,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": -0.06802721088435375,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11118588988848914,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 147,
        "relativeMovesPct": -0.4019292604501608
      }
    },
    {
      "level": 50,
      "summary": {
        "cells": 150,
        "winsGained": 1,
        "winsLost": 2,
        "netWins": -1,
        "bothWin": 142,
        "bothLose": 5,
        "candidateFaster": 29,
        "championFaster": 26,
        "sameSpeed": 87,
        "winRateDifference": -0.006666666666666667,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0.011572808779955708,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.056338028169014086,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.13840662107247625,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 142,
        "relativeMovesPct": 0.2733173898189273
      }
    },
    {
      "level": 51,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 52,
        "championFaster": 30,
        "sameSpeed": 68,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.29333333333333333,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.10386131980160915,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 2.330508474576271
      }
    },
    {
      "level": 52,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 38,
        "championFaster": 18,
        "sameSpeed": 94,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.22,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.09213840382062713,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.8824871648602395
      }
    },
    {
      "level": 53,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 35,
        "championFaster": 20,
        "sameSpeed": 95,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.15333333333333332,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.07956068788930765,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.3434579439252334
      }
    },
    {
      "level": 54,
      "summary": {
        "cells": 150,
        "winsGained": 8,
        "winsLost": 7,
        "netWins": 1,
        "bothWin": 128,
        "bothLose": 7,
        "candidateFaster": 26,
        "championFaster": 23,
        "sameSpeed": 79,
        "winRateDifference": 0.006666666666666667,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0.02590063039262313,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.015625,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.15086054621579348,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 128,
        "relativeMovesPct": 0.0847816871555744
      }
    },
    {
      "level": 55,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 36,
        "championFaster": 25,
        "sameSpeed": 89,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.17333333333333334,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.1035161117123406,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.1738148984198646
      }
    },
    {
      "level": 56,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 33,
        "championFaster": 26,
        "sameSpeed": 91,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.09333333333333334,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.08636153478562922,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 0.7688083470620538
      }
    },
    {
      "level": 57,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 41,
        "championFaster": 30,
        "sameSpeed": 79,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.20666666666666667,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.1328728064709931,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.28470783257356
      }
    },
    {
      "level": 58,
      "summary": {
        "cells": 150,
        "winsGained": 0,
        "winsLost": 0,
        "netWins": 0,
        "bothWin": 150,
        "bothLose": 0,
        "candidateFaster": 55,
        "championFaster": 31,
        "sameSpeed": 64,
        "winRateDifference": 0,
        "winSe": null,
        "winSeLevel": null,
        "winSeSeed": 0,
        "winCi95": [
          null,
          null
        ],
        "meanMovesSaved": 0.32666666666666666,
        "moveSe": null,
        "moveSeLevel": null,
        "moveSeSeed": 0.11011349307508193,
        "moveCi95": [
          null,
          null
        ],
        "mutualWins": 150,
        "relativeMovesPct": 1.75816289917474
      }
    }
  ]
}
```

A single-level two-axis interval is unavailable and remains null. These rows are descriptive.

## Proposal log and joint search

| ID | Coordinate | Dose/parameters | Kind | Outcome | Fresh block | Fresh net wins | Fresh mean savings | Fresh 95% speed CI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | occupancy | 0.001 | generation | NOT_PROMISING | not run | not run | not run | null |
| P02 | occupancy | 1 | generation | NOT_PROMISING | not run | not run | not run | null |
| P03 | occupancy | 8 | generation | NOT_PROMISING | not run | not run | not run | null |
| P04 | occupancy | 128 | generation | NOT_PROMISING | not run | not run | not run | null |
| P05 | occupancy | 1000000 | generation | NOT_PROMISING | not run | not run | not run | null |
| P06 | width | 28 | generation | NOT_ACCEPTED | R1 | 1 | 0.037996545768566495 | [-0.07500757713315764,0.15100066867029063] |
| P07 | width | 32 | generation | ACCEPTED | R2 | 0 | 0.18858131487889274 | [0.05752459666465262,0.3196380330931329] |
| P08 | width | 40 | generation | ACCEPTED | R3 | 0 | 0.1923743500866551 | [0.01801959478746848,0.3667291053858417] |
| P09 | width | 48 | generation | ACCEPTED | R4 | 0 | 0.27461139896373055 | [0.10734304457558164,0.44187975335187946] |
| P10 | width | 64 | generation | NOT_ACCEPTED | R5 | -1 | 0.1692573402417962 | [0.03405835430536677,0.3044563261782256] |
| P11 | pathWidth | 10 | generation | NOT_PROMISING | not run | not run | not run | null |
| P12 | pathWidth | 12 | generation | NOT_PROMISING | not run | not run | not run | null |
| P13 | pathWidth | 16 | generation | NOT_ACCEPTED | R6 | -2 | 0.04498269896193772 | [-0.16313599225105585,0.2531013901749313] |
| P14 | pathWidth | 20 | generation | NOT_PROMISING | not run | not run | not run | null |
| P15 | pathWidth | 24 | generation | NOT_PROMISING | not run | not run | not run | null |
| J01 | joint | {"width":48} | generation | SEARCH_ONLY | not run | not run | not run | null |
| J02 | joint | {"width":40} | generation | SEARCH_ONLY | not run | not run | not run | null |
| J03 | joint | {"width":64} | generation | NOT_PROMISING | R7 | 0 | 0.23529411764705882 | [0.035009219976700895,0.4355790153174167] |
| J04 | joint | {"width":32} | generation | SEARCH_ONLY | not run | not run | not run | null |
| J05 | joint | {"width":28} | generation | SEARCH_ONLY | not run | not run | not run | null |

Each original round's three distinct historical boards, hypothesis, source identity, gate
and fresh recheck are retained in solver/policy-lab/runs/resume/proposals-raw.json and the raw report.
Exploratory ACCEPTED means selection eligibility, not confirmed improvement.
Occupancy dose response and generation/ranking outcomes:

```json
{
  "doseResponse": [
    {
      "dose": 0.001,
      "gate": {
        "cells": 580,
        "winsGained": 0,
        "winsLost": 61,
        "netWins": -61,
        "bothWin": 518,
        "bothLose": 1,
        "candidateFaster": 100,
        "championFaster": 328,
        "sameSpeed": 90,
        "winRateDifference": -0.10517241379310345,
        "winSe": 0.024647841992775095,
        "winSeLevel": 0.024647841992775095,
        "winSeSeed": 0.015517241379310343,
        "winCi95": [
          -0.15348218409894263,
          -0.05686264348726427
        ],
        "meanMovesSaved": -1.5926640926640927,
        "moveSe": 0.2004177014331205,
        "moveSeLevel": 0.2004177014331205,
        "moveSeSeed": 0.19350290746844764,
        "moveCi95": [
          -1.9854827874730088,
          -1.1998453978551766
        ],
        "mutualWins": 518,
        "relativeMovesPct": -12.234910277324635
      },
      "outcome": "NOT_PROMISING"
    },
    {
      "dose": 1,
      "gate": {
        "cells": 580,
        "winsGained": 0,
        "winsLost": 60,
        "netWins": -60,
        "bothWin": 519,
        "bothLose": 1,
        "candidateFaster": 100,
        "championFaster": 329,
        "sameSpeed": 90,
        "winRateDifference": -0.10344827586206896,
        "winSe": 0.024714402222212994,
        "winSeLevel": 0.024714402222212994,
        "winSeSeed": 0.014986672195868155,
        "winCi95": [
          -0.15188850421760644,
          -0.055008047506531495
        ],
        "meanMovesSaved": -1.5992292870905587,
        "moveSe": 0.20115571761326762,
        "moveSeLevel": 0.20115571761326762,
        "moveSeSeed": 0.18767018113464334,
        "moveCi95": [
          -1.9934944936125631,
          -1.2049640805685542
        ],
        "mutualWins": 519,
        "relativeMovesPct": -12.27992306554224
      },
      "outcome": "NOT_PROMISING"
    },
    {
      "dose": 8,
      "gate": {
        "cells": 580,
        "winsGained": 0,
        "winsLost": 55,
        "netWins": -55,
        "bothWin": 524,
        "bothLose": 1,
        "candidateFaster": 101,
        "championFaster": 331,
        "sameSpeed": 92,
        "winRateDifference": -0.09482758620689655,
        "winSe": 0.022865292913998997,
        "winSeLevel": 0.022865292913998997,
        "winSeSeed": 0.010360779527195373,
        "winCi95": [
          -0.13964356031833458,
          -0.05001161209545851
        ],
        "meanMovesSaved": -1.5858778625954197,
        "moveSe": 0.20301092483643843,
        "moveSeLevel": 0.20301092483643843,
        "moveSeSeed": 0.18435599164192434,
        "moveCi95": [
          -1.983779275274839,
          -1.1879764499160004
        ],
        "mutualWins": 524,
        "relativeMovesPct": -12.126076171019992
      },
      "outcome": "NOT_PROMISING"
    },
    {
      "dose": 128,
      "gate": {
        "cells": 580,
        "winsGained": 1,
        "winsLost": 3,
        "netWins": -2,
        "bothWin": 576,
        "bothLose": 0,
        "candidateFaster": 171,
        "championFaster": 269,
        "sameSpeed": 136,
        "winRateDifference": -0.0034482758620689655,
        "winSe": 0.003448275862068966,
        "winSeLevel": 0.003448275862068966,
        "winSeSeed": 0.003448275862068965,
        "winCi95": [
          -0.010206896551724139,
          0.0033103448275862077
        ],
        "meanMovesSaved": -0.5486111111111112,
        "moveSe": 0.16365731551130952,
        "moveSeLevel": 0.12184834898414128,
        "moveSeSeed": 0.16365731551130952,
        "moveCi95": [
          -0.8693794495132778,
          -0.22784277270894449
        ],
        "mutualWins": 576,
        "relativeMovesPct": -4.064308681672026
      },
      "outcome": "NOT_PROMISING"
    },
    {
      "dose": 1000000,
      "gate": {
        "cells": 580,
        "winsGained": 1,
        "winsLost": 6,
        "netWins": -5,
        "bothWin": 573,
        "bothLose": 0,
        "candidateFaster": 135,
        "championFaster": 262,
        "sameSpeed": 176,
        "winRateDifference": -0.008620689655172414,
        "winSe": 0.004633481464539396,
        "winSeLevel": 0.004457558653653408,
        "winSeSeed": 0.004633481464539396,
        "winCi95": [
          -0.017702313325669627,
          0.00046093401532480184
        ],
        "meanMovesSaved": -0.7818499127399651,
        "moveSe": 0.15270842794815154,
        "moveSeLevel": 0.11292078831958785,
        "moveSeSeed": 0.15270842794815154,
        "moveCi95": [
          -1.081158431518342,
          -0.48254139396158807
        ],
        "mutualWins": 573,
        "relativeMovesPct": -5.8001035732780934
      },
      "outcome": "NOT_PROMISING"
    }
  ],
  "outcomeCounts": {
    "NOT_PROMISING": 9,
    "NOT_ACCEPTED": 3,
    "ACCEPTED": 3
  },
  "kindCounts": {
    "generation": 15
  },
  "jointSpace": [
    {
      "kind": "lab",
      "params": {
        "width": 48
      }
    },
    {
      "kind": "lab",
      "params": {
        "width": 40
      }
    },
    {
      "kind": "lab",
      "params": {
        "width": 64
      }
    },
    {
      "kind": "lab",
      "params": {
        "width": 32
      }
    },
    {
      "kind": "lab",
      "params": {
        "width": 28
      }
    }
  ],
  "jointBest": "J03"
}
```

## Accounting, coverage and original goal items

```json
{
  "charged": {
    "controls": 30160,
    "proposals": 16240,
    "jointSearch": 4640,
    "confirmation": 17400,
    "replays": 1380,
    "buffer": 0
  },
  "totalCharged": 69820,
  "caps": {
    "controls": 30160,
    "proposals": 25000,
    "jointSearch": 20000,
    "confirmation": 20000,
    "replays": 5000,
    "buffer": 20000
  },
  "proposalRounds": 15,
  "coverage": {
    "levels": 58,
    "seedsPerLevel": 150,
    "pairs": 8700,
    "completedJobs": 1740,
    "journalCells": 17400,
    "disjoint": true,
    "noRecordingReads": true
  }
}
```

Items 1–4 use source-pinned retained start checks, noise table, generation diagnosis and continuation preregistration.
Item 5 is the completed independently rechecked control phase; items 6–9 are the original 15 proposals, dose response,
conditional joint search and actual frozen selection. Items 10–11 are one complete F plus fresh independent arithmetic.
Item 12 checks all complete panels, one-use seed blocks, journal cells and absence of recording reads in measurement.
No panel was replayed. Full raw output: node docs/goals/policy-terms-loop/print-resume-report.js.
Original historical capture scope is documented in CORPUS_SCOPE.md; those diagnostic recordings are not F evidence.

## Executable evidence handoff

Raw pairs: raw-pairs.json, SHA256 663039d4b412978bb622fc00eb8b6cfee4248e0f95ecf6089a484bd93a33fed2, persisted before the verdict.
Verdict: verdict.json, SHA256 9ec44292b20c3126871b14fdc7912e499c52dff96b41d9d8280e72cc8226b3fc.
Fresh builtin-only recomputation: primary-recomputation.json. Same-author arithmetic is not independent scientific verification.
Additional full-history and actual pre-F trust-input proof:

```json
{
  "result": "RESULT-0082",
  "fullHistoryRegistrations": {
    "docs/goals/policy-terms-loop/EXPLORATION_PLAN.md": "e76f3ec4af2496495697322851bafca0ab73b253",
    "docs/goals/policy-terms-loop/RECOVERY_PLAN.md": "d2025dbfb33d7f9f51647547ac13ec7d618fcbff",
    "docs/goals/policy-terms-loop/RESUME_PLAN.md": "cd7741d87ae722206b0d70f388fd5602e76d6215",
    "experiments/RESULT-0082/protocol.md": "f301e1925c13f4e0ec5b4fd4c23a0989a3009630"
  },
  "actualPreFTestCommit": "68c0a03688f9a253499804d6b428cb3c8c05aeef",
  "trustHashes": {
    "docs/goals/policy-terms-loop/live-suite.js": "7ac242af857768475e4f825bb925df1ca8c0ee1b216ea01af12cc7be1292a5bd",
    "docs/goals/policy-terms-loop/baseline-output.txt": "0a553cae879cb8e93f272e6aa54e1e235e13a1cbdba16c026471516e7089392a"
  },
  "preFTotals": {
    "tests": 672,
    "pass": 668,
    "fail": 3,
    "skipped": 1
  },
  "scope": "Additional read-only evidence audit. Original protocol unchanged; it did not separately freeze validator/baseline. They equal their actual pre-F receipt-commit bytes and never changed in subsequent history."
}
```

The original F protocol did not separately freeze live-suite.js or baseline-output.txt.
The additional read-only audit verifies their exact actual pre-F receipt-commit bytes and unchanged subsequent history,
and the terminal closeout pin binds them. This is not a rewritten preregistration or a claim of original dispatch prevention.

The provisional ledger record, CURRENT/backlog handoff, committed closeout pin and live gates are required separately.
No checked_by, merge, adoption or scientific self-acceptance is assigned here.
