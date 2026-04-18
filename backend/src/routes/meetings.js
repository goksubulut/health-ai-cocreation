const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  createMeetingRequestSchema,
  proposeSlotsSchema,
  updateSlotSchema,
} = require('../validations/meetingSchemas');

router.use(authenticate);

// POST /api/meetings
router.post('/', validate(createMeetingRequestSchema), meetingController.createMeetingRequest);

// GET /api/meetings
router.get('/', meetingController.getMyMeetings);

// PATCH /api/meetings/:id/accept
router.patch('/:id/accept', meetingController.acceptMeetingRequest);

// PATCH /api/meetings/:id/decline
router.patch('/:id/decline', meetingController.declineMeetingRequest);

// POST /api/meetings/:id/slots
router.post('/:id/slots', validate(proposeSlotsSchema), meetingController.proposeSlots);

// PATCH /api/meetings/:id/slots/:slotId
router.patch(
  '/:id/slots/:slotId',
  validate(updateSlotSchema),
  meetingController.updateSlot
);

// DELETE /api/meetings/:id/slots/:slotId
router.delete('/:id/slots/:slotId', meetingController.deleteSlot);

// PATCH /api/meetings/:id/slots/:slotId/confirm
router.patch('/:id/slots/:slotId/confirm', meetingController.confirmSlot);

// DELETE /api/meetings/:id
router.delete('/:id', meetingController.cancelMeetingRequest);

// GET /api/meetings/:id (en sonda)
router.get('/:id', meetingController.getMeetingById);

module.exports = router;
