import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});

const assignmentModels = mongoose.model("Assignment", assignmentSchema);
export default assignmentModels;
