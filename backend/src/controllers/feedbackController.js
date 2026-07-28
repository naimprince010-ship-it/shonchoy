const prisma = require('../utils/prisma');

// FO submits feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const feedback = await prisma.feedbackLog.create({
      data: {
        message,
        user_id: req.user.id
      }
    });

    res.status(201).json({ message: 'Feedback submitted successfully', data: feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin gets feedback
exports.getFeedbacks = async (req, res) => {
  try {
    const { status } = req.query;
    
    let where = {};
    if (status) {
      where.status = status;
    }

    const feedbacks = await prisma.feedbackLog.findMany({
      where,
      include: {
        user: { select: { name: true, role: true, phone: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin resolves feedback
exports.resolveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await prisma.feedbackLog.update({
      where: { id: parseInt(id) },
      data: { status: 'RESOLVED' }
    });

    res.json({ message: 'Feedback marked as resolved', data: feedback });
  } catch (error) {
    console.error('Resolve feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
