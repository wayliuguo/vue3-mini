import { h } from "../../dist/mini-vue.esm-bundler.js";

export default {
  name: "App",
  setup() {
    return {
      msg: "mini-vue",
    };
  },

  render() {
    return h("div", {}, "hi," + this.msg);
  },
};
