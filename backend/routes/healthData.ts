import { Router } from "../deps.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import {
  confirmHealthImportHandler,
  createManualMeasurementHandler,
  getHealthDataProfileHandler,
  listHealthMeasurementsHandler,
  previewHealthImportHandler,
  updateHealthDataProfileHandler,
  setPrimaryMeasurementHandler,
} from "../controllers/healthDataController.ts";

const router = new Router();

router.get("/profile", authMiddleware, getHealthDataProfileHandler);
router.put("/profile", authMiddleware, updateHealthDataProfileHandler);
router.get("/measurements", authMiddleware, listHealthMeasurementsHandler);
router.post("/measurements", authMiddleware, createManualMeasurementHandler);
router.patch("/measurements/:id/primary", authMiddleware, setPrimaryMeasurementHandler);
router.post("/imports/preview", authMiddleware, previewHealthImportHandler);
router.post("/imports/confirm", authMiddleware, confirmHealthImportHandler);

export default router;
