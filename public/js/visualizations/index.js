// public/js/visualizations/index.js
export { default as AIAssistant } from './AIAssistant.js';
export { default as AchievementDisplay } from './AchievementDisplay.js';
export { default as ModuleHighlight } from './ModuleHighlight.js';
export { default as PathPredictor } from './PathPredictor.js';
export { default as ProgressTracker } from './ProgressTracker.js';

const AchievementDisplay = require('./AchievementDisplay');
const PathPredictor = require('./PathPredictor');
const ModuleHighlight = require('./ModuleHighlight');
const ProgressTracker = require('./ProgressTracker');

module.exports = {
  AchievementDisplay,
  PathPredictor,
  ModuleHighlight,
  ProgressTracker,
};
