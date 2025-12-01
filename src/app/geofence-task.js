import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";

TaskManager.defineTask("GEOFENCE_TASK", ({ data, error }) => {
  if (error) return;

  const region = data.region;
  Notifications.scheduleNotificationAsync({
    content: {
      title: "Geofence Alert",
      body: region.identifier + " triggered!",
    },
    trigger: null,
  });
});
