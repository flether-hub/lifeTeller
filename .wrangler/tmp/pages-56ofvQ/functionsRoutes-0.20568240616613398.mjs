import { onRequestDelete as __api_admin_readings__id__ts_onRequestDelete } from "/app/applet/functions/api/admin/readings/[id].ts"
import { onRequestPost as __api_admin_login_ts_onRequestPost } from "/app/applet/functions/api/admin/login.ts"
import { onRequestGet as __api_admin_map_data_ts_onRequestGet } from "/app/applet/functions/api/admin/map-data.ts"
import { onRequestPost as __api_fortune_check_ts_onRequestPost } from "/app/applet/functions/api/fortune/check.ts"
import { onRequestPost as __api_fortune_generate_ts_onRequestPost } from "/app/applet/functions/api/fortune/generate.ts"
import { onRequestPost as __api_fortune_save_ts_onRequestPost } from "/app/applet/functions/api/fortune/save.ts"
import { onRequest as __api_admin_readings_index_ts_onRequest } from "/app/applet/functions/api/admin/readings/index.ts"
import { onRequest as __api_admin_settings_ts_onRequest } from "/app/applet/functions/api/admin/settings.ts"
import { onRequest as __api_config_ts_onRequest } from "/app/applet/functions/api/config.ts"

export const routes = [
    {
      routePath: "/api/admin/readings/:id",
      mountPath: "/api/admin/readings",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_readings__id__ts_onRequestDelete],
    },
  {
      routePath: "/api/admin/login",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_login_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/map-data",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_map_data_ts_onRequestGet],
    },
  {
      routePath: "/api/fortune/check",
      mountPath: "/api/fortune",
      method: "POST",
      middlewares: [],
      modules: [__api_fortune_check_ts_onRequestPost],
    },
  {
      routePath: "/api/fortune/generate",
      mountPath: "/api/fortune",
      method: "POST",
      middlewares: [],
      modules: [__api_fortune_generate_ts_onRequestPost],
    },
  {
      routePath: "/api/fortune/save",
      mountPath: "/api/fortune",
      method: "POST",
      middlewares: [],
      modules: [__api_fortune_save_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/readings",
      mountPath: "/api/admin/readings",
      method: "",
      middlewares: [],
      modules: [__api_admin_readings_index_ts_onRequest],
    },
  {
      routePath: "/api/admin/settings",
      mountPath: "/api/admin",
      method: "",
      middlewares: [],
      modules: [__api_admin_settings_ts_onRequest],
    },
  {
      routePath: "/api/config",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_config_ts_onRequest],
    },
  ]