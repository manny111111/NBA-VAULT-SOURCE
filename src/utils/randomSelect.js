function getRandomDaily(min = 20000, max = 40000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  getRandomDaily,
};
