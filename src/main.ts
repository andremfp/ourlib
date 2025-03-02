import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router"; // Import the router

import "./style.css"; // Tailwind CSS or your custom styles

const app = createApp(App);
const pinia = createPinia();

app.use(router); // Register the router
app.use(pinia); // Register Pinia
app.mount("#app");
