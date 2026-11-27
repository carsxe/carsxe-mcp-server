import assert from "node:assert/strict";
import { describe, it } from "node:test";
import vm from "node:vm";
import {
  PREVIEW_MARKET_VALUE,
  PREVIEW_RECALLS,
  PREVIEW_VEHICLE_CARD,
} from "./cards.js";
import { marketValueHtml, recallsHtml, vehicleCardHtml } from "./widgetHtml.js";

type Posted = {
  jsonrpc?: string;
  id?: number;
  method?: string;
  params?: { width?: number; height?: number; arguments?: unknown };
};

function extractScript(html: string): string {
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  assert.ok(match, "widget html is missing its script");
  return match[1] ?? "";
}

function mount(html: string) {
  const posted: Posted[] = [];
  const listeners: Array<(event: { source: unknown; data: unknown }) => void> =
    [];
  const root = {
    html: "",
    get innerHTML() {
      return this.html;
    },
    set innerHTML(value: string) {
      this.html = value;
    },
    get offsetHeight() {
      return this.html.length > 80 ? 220 : 48;
    },
  };
  const parent = {
    postMessage(message: Posted) {
      posted.push(message);
    },
  };
  const window = {
    parent,
    openai: undefined as { toolOutput?: unknown } | undefined,
    matchMedia() {
      return { matches: false, addEventListener() {} };
    },
    addEventListener(
      _type: string,
      fn: (event: { source: unknown; data: unknown }) => void,
    ) {
      listeners.push(fn);
    },
    innerWidth: 420,
    ResizeObserver: class {
      observe() {}
    },
  };
  const document = {
    documentElement: {
      classList: { toggle() {} },
      scrollHeight: 48,
      clientWidth: 420,
    },
    body: { scrollHeight: 48 },
    getElementById(id: string) {
      return id === "root" ? root : null;
    },
  };
  vm.runInContext(
    extractScript(html),
    vm.createContext({ window, document, Intl, console }),
  );
  return {
    posted,
    root,
    window,
    dispatch(data: unknown) {
      for (const fn of listeners) fn({ source: parent, data });
    },
  };
}

function initResult() {
  return {
    jsonrpc: "2.0",
    id: 1,
    result: {
      protocolVersion: "2026-01-26",
      hostInfo: { name: "harness", version: "0" },
      hostCapabilities: {},
      hostContext: { theme: "light" },
    },
  };
}

describe("widget handshake", () => {
  it("asks the host to initialize and then signals ready", () => {
    for (const html of [vehicleCardHtml(), marketValueHtml(), recallsHtml()]) {
      assert.match(html, /method:\s*"ui\/initialize"/);
      assert.match(html, /appInfo:\s*\{/);
      assert.equal(html.includes("clientInfo"), false);
      assert.match(html, /ui\/notifications\/initialized/);
      assert.match(html, /ui\/notifications\/size-changed/);
      assert.match(html, /2026-01-26/);
    }

    const view = mount(vehicleCardHtml());
    const init = view.posted.find((message) => message.method === "ui/initialize");
    assert.equal(init?.id, 1);
    assert.equal(
      view.posted.some(
        (message) => message.method === "ui/notifications/initialized",
      ),
      false,
    );
  });

  it("renders tool output only after the host answers initialize", () => {
    const view = mount(vehicleCardHtml());
    const init = view.posted.find((message) => message.method === "ui/initialize");
    assert.ok(init);
    const initParams = init as unknown as {
      params: {
        protocolVersion: string;
        appInfo: { name: string; version: string };
        appCapabilities: { availableDisplayModes: string[] };
      };
    };
    assert.equal(initParams.params.protocolVersion, "2026-01-26");
    assert.equal(initParams.params.appInfo.name, "carsxe-card");
    assert.equal(initParams.params.appCapabilities.availableDisplayModes[0], "inline");

    view.dispatch({
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: { structuredContent: PREVIEW_VEHICLE_CARD },
    });
    assert.equal(view.root.innerHTML.includes("WBAFR7C57CC811956"), false);

    view.dispatch(initResult());
    assert.ok(
      view.posted.some(
        (message) => message.method === "ui/notifications/initialized",
      ),
    );
    assert.ok(view.root.innerHTML.includes("WBAFR7C57CC811956"));
    assert.ok(view.root.innerHTML.includes("550i"));
    assert.ok(
      view.posted.some(
        (message) =>
          message.method === "ui/notifications/size-changed" &&
          message.params?.height === 220,
      ),
    );
  });

  it("renders each card from the host bridge", () => {
    const cases = [
      { html: marketValueHtml(), data: PREVIEW_MARKET_VALUE, text: "CA" },
      { html: recallsHtml(), data: PREVIEW_RECALLS, text: "24V-184" },
    ];
    for (const entry of cases) {
      const view = mount(entry.html);
      view.dispatch({
        jsonrpc: "2.0",
        method: "ui/notifications/tool-result",
        params: { structuredContent: entry.data },
      });
      view.dispatch(initResult());
      assert.ok(
        view.posted.some(
          (message) => message.method === "ui/notifications/initialized",
        ),
      );
      assert.ok(view.root.innerHTML.includes(entry.text));
    }
  });

  it("renders tool-input arguments, not the notification wrapper", () => {
    const view = mount(vehicleCardHtml());
    view.dispatch(initResult());
    view.dispatch({
      jsonrpc: "2.0",
      method: "ui/notifications/tool-input",
      params: { arguments: PREVIEW_VEHICLE_CARD },
    });
    assert.ok(view.root.innerHTML.includes("BMW"));
    assert.equal(view.root.innerHTML.includes("[object Object]"), false);
  });

  it("reads window.openai.toolOutput after the handshake", () => {
    const view = mount(vehicleCardHtml());
    view.window.openai = { toolOutput: PREVIEW_VEHICLE_CARD };
    view.dispatch(initResult());
    assert.ok(view.root.innerHTML.includes("BMW"));
  });

  it("renders a preview without a host", () => {
    const html = vehicleCardHtml().replace(
      "<script>",
      `<script>window.__CARSXE_PREVIEW__ = ${JSON.stringify(PREVIEW_VEHICLE_CARD)};`,
    );
    const view = mount(html);
    assert.equal(
      view.posted.some((message) => message.method === "ui/initialize"),
      false,
    );
    assert.ok(view.root.innerHTML.includes("BMW"));
  });
});
