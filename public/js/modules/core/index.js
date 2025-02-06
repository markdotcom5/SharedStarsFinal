// public/js/modules/core/index.js
export { default as AchievementHandler } from './achievementHandler.js';
export { default as Dashboard } from './dashboard.js';
export { default as Homepage } from './homepage.js';
export { default as SpaceTimelineManager } from './spaceTimelineManager.js';
import { signup } from './signup.js';
import { profile } from './profile.js';
import { achievementHandler } from './achievementHandler.js';

export const core = {
    signup,
    profile,
    achievementHandler
};