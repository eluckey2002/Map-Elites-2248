const { search } = require('./search');
process.once('message', input => {
  try {
    const result = search(input, progress => process.send({ type: 'progress', progress }));
    process.send({ type: 'done', result }, () => process.disconnect());
  } catch (error) {
    process.send({ type: 'error', message: error.stack }, () => process.disconnect());
  }
});
