import { onRequestGet as __api_verify_certificate_js_onRequestGet } from "C:\\Users\\ahmed\\Desktop\\alabqri\\functions\\api\\verify-certificate.js"
import { onRequestPost as __api_verify_certificate_js_onRequestPost } from "C:\\Users\\ahmed\\Desktop\\alabqri\\functions\\api\\verify-certificate.js"

export const routes = [
    {
      routePath: "/api/verify-certificate",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_verify_certificate_js_onRequestGet],
    },
  {
      routePath: "/api/verify-certificate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_certificate_js_onRequestPost],
    },
  ]