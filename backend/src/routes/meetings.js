const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  createMeetingRequestSchema,
  proposeTimeSchema,
  confirmTimeSchema,
} = require('../validations/meetingSchemas');

router.use(authenticate);

// POST /api/meetings              — Talep gönder (NDA zorunlu)
router.post('/', validate(createMeetingRequestSchema), meetingController.createMeetingRequest);

// GET /api/meetings               — Gelen + giden talepler
router.get('/', meetingController.getMyMeetings);

// GET /api/meetings/:id           — Talep detayı
router.get('/:id', meetingController.getMeetingById);

// PATCH /api/meetings/:id/accept  — Talebi kabul et
router.patch('/:id/accept', meetingController.acceptMeetingRequest);

// PATCH /api/meetings/:id/decline — Talebi reddet
router.patch('/:id/decline', meetingController.declineMeetingRequest);

// PATCH /api/meetings/:id/propose-time — Zaman öner
router.patch('/:id/propose-time', validate(proposeTimeSchema), meetingController.proposeTime);

// PATCH /api/meetings/:id/confirm-time — Zamanı onayla
router.patch('/:id/confirm-time', validate(confirmTimeSchema), meetingController.confirmTime);

// DELETE /api/meetings/:id        — İptal et
router.delete('/:id', meetingController.cancelMeetingRequest);

module.exports = router;
