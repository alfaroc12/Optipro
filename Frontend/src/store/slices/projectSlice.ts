import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Project } from "@/types/project";

interface ProjectState {
  projects: Project[];
  loading: boolean;
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    fetchProjectsStart(state) {
      state.loading = true;
    },
    fetchProjectsSuccess(state, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
      state.loading = false;
    },
    fetchProjectsFailure(state) {
      state.loading = false;
    },
  },
});

export const {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
} = projectSlice.actions;
export default projectSlice.reducer;
