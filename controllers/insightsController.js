const Insight = require('../models/Insight');
const { validationResult } = require('express-validator');

class InsightsController {
    async getAllInsights(req, res) {
        try {
            const { category, limit = 10, page = 1 } = req.query;
            const query = category ? { category } : {};
            
            const insights = await Insight.find(query)
                .sort({ publishDate: -1 })
                .limit(parseInt(limit))
                .skip((page - 1) * limit)
                .populate('author', 'name role');

            const total = await Insight.countDocuments(query);

            res.json({
                insights,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getInsightById(req, res) {
        try {
            const insight = await Insight.findById(req.params.id)
                .populate('author', 'name role')
                .populate('relatedInsights');

            if (!insight) {
                return res.status(404).json({ error: 'Insight not found' });
            }

            await Insight.updateOne(
                { _id: req.params.id },
                { $inc: { views: 1 } }
            );

            res.json(insight);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createInsight(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const insight = new Insight({
                ...req.body,
                author: req.user.id,
                publishDate: new Date()
            });

            await insight.save();
            res.status(201).json(insight);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateInsight(req, res) {
        try {
            const insight = await Insight.findOneAndUpdate(
                { _id: req.params.id, author: req.user.id },
                { ...req.body, lastUpdated: new Date() },
                { new: true }
            );

            if (!insight) {
                return res.status(404).json({ error: 'Insight not found' });
            }

            res.json(insight);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteInsight(req, res) {
        try {
            const insight = await Insight.findOneAndDelete({
                _id: req.params.id,
                author: req.user.id
            });

            if (!insight) {
                return res.status(404).json({ error: 'Insight not found' });
            }

            res.json({ message: 'Insight deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async searchInsights(req, res) {
        try {
            const { query, tags } = req.query;
            const searchQuery = {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { content: { $regex: query, $options: 'i' } }
                ]
            };

            if (tags) {
                searchQuery.tags = { $in: tags.split(',') };
            }

            const insights = await Insight.find(searchQuery)
                .sort({ publishDate: -1 })
                .populate('author', 'name role');

            res.json(insights);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new InsightsController();