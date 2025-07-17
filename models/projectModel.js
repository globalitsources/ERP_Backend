import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    required: false,
  },
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
