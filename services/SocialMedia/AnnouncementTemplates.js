// services/socialMedia/AnnouncementTemplates.js
class AnnouncementTemplates {
    constructor() {
        this.templates = {
            newUser: {
                twitter: (user) => ({
                    message: `🚀 Welcome aboard, ${user.name}! Another future astronaut joins SharedStars Academy. #FutureAstronaut #SpaceTraining`,
                    media: "welcome-badge.jpg"
                }),
                linkedin: (user) => ({
                    message: `🌟 We're excited to welcome ${user.name} to SharedStars Academy! SharedStars is training the next generation of astronauts. #SpaceTraining #FutureAstronaut`,
                    media: "welcome-professional.jpg"
                }),
                facebook: (user) => ({
                    message: `🎉 Welcome ${user.name} to the SharedStars family! Another future astronaut begins their journey. Join us! #FutureAstronaut #SpaceTraining`,
                    media: "welcome-social.jpg"
                }),
                instagram: (user) => ({
                    message: `✨ Welcome ${user.name} to SharedStars! 🚀 The journey to space starts here! #FutureAstronaut #SpaceDreams`,
                    media: "welcome-insta.jpg"
                }),
                tiktok: (user) => ({
                    message: `🎵 Welcome to SharedStars, ${user.name}! 🚀 Training for space has never been this exciting! #SpaceTraining #FutureAstronaut`,
                    media: "welcome-tiktok.mp4"
                }),
                telegram: (user) => ({
                    message: `📢 Welcome ${user.name} to SharedStars Academy! Another space explorer begins their journey! #FutureAstronaut #SpaceTraining`,
                    media: "welcome-telegram.jpg"
                }),
                youtube: (user) => ({
                    message: `🎥 Welcome ${user.name} to SharedStars! 🚀 Watch their training journey unfold. #FutureAstronaut #SpaceTraining`,
                    media: "welcome-youtube.mp4"
                })
            },

            certification: {
                twitter: (user, cert) => ({
                    message: `🏆 Congratulations ${user.name} on achieving ${cert.name} certification! One giant leap closer to space! 🚀 #SpaceCertified #AstronautTraining`,
                    media: cert.badgeUrl
                }),
                linkedin: (user, cert) => ({
                    message: `🎓 Achievement Unlocked: ${cert.name} Certification at SharedStars Academy. Congratulations to ${user.name}! #SpaceEducation #AstronautTraining`,
                    media: cert.professionalBadgeUrl
                }),
                facebook: (user, cert) => ({
                    message: `🎊 Major Achievement Alert! ${user.name} earned the ${cert.name} certification! ✅ Training Completed ✅ Mastery Achieved 🚀 #SpaceCertified #FutureAstronaut`,
                    media: cert.socialBadgeUrl
                }),
                instagram: (user, cert) => ({
                    message: `🚀 Certified for space! 🌌 Congrats to ${user.name} for completing ${cert.name}. #AstronautTraining #FutureAstronaut`,
                    media: cert.instaBadgeUrl
                }),
                tiktok: (user, cert) => ({
                    message: `🎵 Another astronaut in training! Congrats ${user.name} on earning ${cert.name}! #SpaceCertified #AstronautTraining`,
                    media: cert.tiktokBadgeUrl
                }),
                telegram: (user, cert) => ({
                    message: `📢 Big news! ${user.name} has officially earned the ${cert.name} certification! 🚀 #AstronautTraining #SpaceCertified`,
                    media: cert.telegramBadgeUrl
                }),
                youtube: (user, cert) => ({
                    message: `🎥 Watch ${user.name} achieve their ${cert.name} certification! The journey to space continues. 🚀 #FutureAstronaut #SpaceEducation`,
                    media: cert.youtubeBadgeUrl
                })
            },

            missionComplete: {
                twitter: (user, mission) => ({
                    message: `🛸 Mission Accomplished! ${user.name} completed ${mission.name} with ${mission.score}% success rate! #SpaceMission #AstronautTraining`,
                    media: mission.completionBadge
                }),
                linkedin: (user, mission) => ({
                    message: `🚀 Mission Success: ${mission.name} by ${user.name}! Mission Objectives Achieved: ${mission.objectives.map(obj => `✅ ${obj}`).join('\n')} #SpaceTraining #MissionSuccess`,
                    media: mission.professionalBadge
                }),
                facebook: (user, mission) => ({
                    message: `🎯 Mission Complete! Congrats to ${user.name} on completing ${mission.name}! 🏆 Score: ${mission.score}% ⏱️ Time: ${mission.completionTime} #SpaceMission #AstronautTraining`,
                    media: mission.socialBadge
                }),
                instagram: (user, mission) => ({
                    message: `🌟 Another mission completed! ${user.name} just finished ${mission.name} at SharedStars! 🚀 #SpaceTraining #AstronautLife`,
                    media: mission.instaBadge
                }),
                tiktok: (user, mission) => ({
                    message: `🎵 Watch ${user.name} complete the ${mission.name} mission! 🚀 #MissionComplete #AstronautTraining`,
                    media: mission.tiktokBadge
                }),
                telegram: (user, mission) => ({
                    message: `📢 Breaking News! ${user.name} just completed the ${mission.name} mission with a ${mission.score}% success rate! #SpaceMission #AstronautTraining`,
                    media: mission.telegramBadge
                }),
                youtube: (user, mission) => ({
                    message: `🎥 Watch ${user.name} successfully complete the ${mission.name} mission! 🚀 #MissionSuccess #FutureAstronaut`,
                    media: mission.youtubeBadge
                })
            }
        };
    }

    getTemplate(type, platform, data) {
        if (!this.templates[type] || !this.templates[type][platform]) {
            throw new Error(`Template not found for type: ${type}, platform: ${platform}`);
        }
        return this.templates[type][platform](data.user, data.details);
    }

    customizeTemplate(template, customizations) {
        return {
            ...template,
            message: this.applyCustomizations(template.message, customizations)
        };
    }

    applyCustomizations(message, customizations) {
        let customizedMessage = message;
        Object.entries(customizations).forEach(([key, value]) => {
            customizedMessage = customizedMessage.replace(`{{${key}}}`, value);
        });
        return customizedMessage;
    }
}

module.exports = new AnnouncementTemplates();
