import Joi from "joi";
import { Booking } from "../models/Booking.js";

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref("startDate")).required(),
  purpose: Joi.string().optional(),
bookedBy: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  purpose: Joi.string().optional(),
bookedBy: Joi.string().hex().length(24)
});

// TODO: per README.md section 4, you will need a way to detect whether a
// proposed booking conflicts with an existing one on the same room.

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    // TODO
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate("bookedBy", "name email")
      .lean();
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getBooking(req, res, next) {
  try {
    // TODO
    const booking = await Booking.findById(req.params.id).populate(
      "bookedBy",
      "name email",
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ booking });
  } catch (err) {
    next(err);
  }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    // TODO
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Booking.findOne({
      roomNumber: value.roomNumber,
      startDate: { $lt: value.endDate },
      endDate: { $gt: value.startDate },
    });
    if (existing)
      return res
        .status(409)
        .json({ message: "Room is already booked for the selected period" });

    const booking = await Booking.create(value);
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id
// TODO: implement per README.md sections 3, 4, and 5.
export async function updateBooking(req, res, next) {
  try {
    // TODO
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return res.status(400).json({ message: error.message });
    const existing = await Booking.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ message: "Booking not found" });

    const roomNumber = value.roomNumber ?? existing.roomNumber;
    const startDate = value.startDate ?? existing.startDate;
    const endDate = value.endDate ?? existing.endDate;

    if (!(new Date(startDate) < new Date(endDate))) {
      return res
        .status(400)
        .json({ message: "startDate must be strictly before endDate" });
    }

    const conflict = await Booking.findOne({
      _id: { $ne: existing._id },
      roomNumber,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });
    if (conflict) {
      return res
        .status(409)
        .json({ message: "Room is already booked for the selected period" });
    }

    Object.assign(existing, value);
    await existing.save();
    res.json({ booking: existing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
    // TODO
    const doc = await Booking.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
