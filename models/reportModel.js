import mongoose from "mongoose";

const workEntrySchema = new mongoose.Schema({
  workType: { type: String, required: true },
  taskNumber: { type: Number, required: true },
  workDescription: { type: String, required: true },
});

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    reports: {
      type: [workEntrySchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one report is required"],
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
