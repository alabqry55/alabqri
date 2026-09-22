import { onRequestGet as __api_verify_certificate_js_onRequestGet } from "C:\\Users\\ahmed\\Desktop\\alabqri\\functions\\api\\verify-certificate.js"
import { onRequestPost as __api_verify_certificate_js_onRequestPost } from "C:\\Users\\ahmed\\Desktop\\alabqri\\functions\\api\\verify-certificate.js"
import { onRequestGet as __api_visitors_js_onRequestGet } from "C:\\Users\\ahmed\\Desktop\\alabqri\\functions\\api\\visitors.js"
import { onRequest as __api_feedback_js_onRequest } from "C:\\Users\\ahmed\\Desktop\\alabqri\\functions\\api\\feedback.js"

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
  {
      routePath: "/api/visitors",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_visitors_js_onRequestGet],
    },
  {
      routePath: "/api/feedback",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_feedback_js_onRequest],
    },
  ]