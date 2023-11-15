/* global React ReactDOM */
import { sfConn, apiVersion } from "./inspector.js";
/* global initButton */
import { DescribeInfo } from "./data-load.js";

class Model {

  constructor(sfHost) {
    this.sfHost = sfHost;

    this.sfLink = "https://" + this.sfHost;
    this.userInfo = "...";
    if (localStorage.getItem(sfHost + "_isSandbox") != "true") {
      //change background color for production
      document.body.classList.add("prod");
    }

    this.describeInfo = new DescribeInfo(this.spinFor.bind(this), () => { });
    this.spinFor(sfConn.soap(sfConn.wsdl(apiVersion, "Partner"), "getUserInfo", {}).then(res => {
      this.userInfo = res.userFullName + " / " + res.userName + " / " + res.organizationName;
    }));
  }

  /**
   * Notify React that we changed something, so it will rerender the view.
   * Should only be called once at the end of an event or asynchronous operation, since each call can take some time.
   * All event listeners (functions starting with "on") should call this function if they update the model.
   * Asynchronous operations should use the spinFor function, which will call this function after the asynchronous operation completes.
   * Other functions should not call this function, since they are called by a function that does.
   * @param cb A function to be called once React has processed the update.
   */
  didUpdate(cb) {
    if (this.reactCallback) {
      this.reactCallback(cb);
    }
    if (this.testCallback) {
      this.testCallback();
    }
  }

  /**
   * Show the spinner while waiting for a promise.
   * didUpdate() must be called after calling spinFor.
   * didUpdate() is called when the promise is resolved or rejected, so the caller doesn't have to call it, when it updates the model just before resolving the promise, for better performance.
   * @param promise The promise to wait for.
   */
  spinFor(promise) {
    this.spinnerCount++;
    promise
      .catch(err => {
        console.error("spinFor", err);
      })
      .then(() => {
        this.spinnerCount--;
        this.didUpdate();
      })
      .catch(err => console.log("error handling failed", err));
  }

}

class OptionsTabSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTabId: 1
    };
    this.tabs = [
      {
        id: 1,
        tabTitle: "Tab1",
        title: "User Experience",
        content: [{ option: ArrowButtonOption, key: 1 }]
      },
      {
        id: 2,
        tabTitle: "Tab2",
        title: "API",
        content: [
          { option: APIVersionOption, key: 1 },
          { option: APIKeyOption, key: 2 }
        ]
      },
    ];
    this.onTabSelect = this.onTabSelect.bind(this);
  }

  onTabSelect(e) {
    e.preventDefault();
    this.setState({ selectedTabId: e.target.tabIndex});
  }

  render() {
    return h("div", {className: "slds-tabs_default"},
      h("ul", { className: "options-tab-container slds-tabs_default__nav", role: "tablist"} ,
        this.tabs.map((tab) => h(OptionsTab, { key: tab.id, title: tab.title, id: tab.id, selectedTabId: this.state.selectedTabId, onTabSelect: this.onTabSelect }))
      ),
      this.tabs.map((tab) => h(OptionsContainer, { key: tab.id, id: tab.id, content: tab.content, selectedTabId: this.state.selectedTabId }))
    );
  }
}

class OptionsTab extends React.Component {

  getClass() {
    return "options-tab slds-text-align_center slds-tabs_default__item" + (this.props.selectedTabId === this.props.id ? " slds-is-active" : "");
  }

  render() {
    return h("li", { key: this.props.id, className: this.getClass(), title: this.props.title, tabIndex: this.props.id, role: "presentation", onClick: this.props.onTabSelect },
      h("a", { className: "slds-tabs_default__link", href: "#", role: "tab", tabIndex: this.props.id, id: "tab-default-" + this.props.id + "__item" },
        this.props.title)
    );
  }
}

class OptionsContainer extends React.Component {

  getClass() {
    return (this.props.selectedTabId === this.props.id ? "slds-show" : " slds-hide");
  }

  render() {
    return h("div", { id: this.props.id, className: this.getClass(), role: "tabpanel" }, this.props.content.map((c) => h(c.option, { key: c.key })));
  }

}

class ArrowButtonOption extends React.Component {

  constructor(props) {
    super(props);
    this.onChangeArrowOrientation = this.onChangeArrowOrientation.bind(this);
    this.onChangeArrowPosition = this.onChangeArrowPosition.bind(this);
    this.state = {
      arrowButtonOrientation: localStorage.getItem("popupArrowOrientation") ? localStorage.getItem("popupArrowOrientation") : "vertical",
      arrowButtonPosition: localStorage.getItem("popupArrowPosition") ? localStorage.getItem("popupArrowPosition") : "20"
    };
    this.timeout;
  }

  onChangeArrowOrientation(e) {
    let orientation = e.target.value;
    this.setState({arrowButtonOrientation: orientation});
    console.log("[SFInspector] Setting Arrow Orientation: ", orientation);
    localStorage.setItem("popupArrowOrientation", orientation);
    window.location.reload();
  }

  onChangeArrowPosition(e) {
    let position = e.target.value;
    this.setState({arrowButtonPosition: position});
    console.log("[SFInspector] New Arrow Position Value: ", position);
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      console.log("[SFInspector] Setting Arrow Position: ", position);
      localStorage.setItem("popupArrowPosition", position);
      window.location.reload();
    }, 1000);
  }

  render() {
    return h("div", { className: "slds-grid slds-border_bottom slds-p-horizontal_small slds-p-vertical_xx-small" },
      h("div", { className: "slds-col slds-size_4-of-12 text-align-middle"},
        h("span", {}, "Arrow Button orientation and position (refresh page to update)")
      ),
      h("div", { className: "slds-col slds-size_8-of-12 slds-form-element slds-grid slds-grid_align-end slds-grid_vertical-align-center slds-gutters_small" },
        h("label", { className: "slds-col slds-size_2-of-12 slds-align_right slds-text-align_right" }, "Orientation:"),
        h("select", { className: "slds-col slds-size_2-of-12 slds-combobox__form-element slds-input combobox-container", defaultValue: this.state.arrowButtonOrientation, name: "arrowPosition", id: "arrowPosition", onChange: this.onChangeArrowOrientation }, 
          h("option", { value: "horizontal" }, "Horizontal" ),
          h("option", { value: "vertical" }, "Vertical" )
        ),
        h("label", { className: "slds-m-left_medium slds-col slds-size_2-of-12 slds-text-align_right", htmlFor: "arrowPositionSlider" }, "Position (%):"),
        h("div", { className: "slds-form-element__control slider-container slds-col slds-size_4-of-12" },
          h("div", { className: "slds-slider sdlds-m-left_small" },
            h("input", { type: "range", id: "arrowPositionSlider", className: "slds-slider__range", value: this.state.arrowButtonPosition, min: "0", max: "100", step: "1", onChange: this.onChangeArrowPosition }),
            h("span", { className: "slds-slider__value", "aria-hidden": true }, this.state.arrowButtonPosition )
          )
        )
      )
    );
  }
}

class APIVersionOption extends React.Component {

  constructor(props) {
    super(props);
    this.onChangeApiVersion = this.onChangeApiVersion.bind(this);
    this.state = { apiVersion: localStorage.getItem("apiVersion") };
  }

  onChangeApiVersion(e) {
    let apiVersion = e.target.value;
    this.setState({ apiVersion });
    localStorage.setItem("apiVersion", apiVersion + ".0");
  }

  render() {
    return h("div", { className: "slds-grid slds-border_bottom slds-p-horizontal_small slds-p-vertical_xx-small" },
      h("div", { className: "slds-col slds-size_4-of-12 text-align-middle"},
        h("span", {}, "API Version")
      ),
      h("div", { className: "slds-col slds-size_8-of-12 slds-form-element slds-grid slds-grid_align-end slds-grid_vertical-align-center slds-gutters_small" },
        h("div", { className: "slds-form-element__control slds-col slds-size_2-of-12" },
          h("input", { type: "number", required: true, id: "apiVersionInput", className: "slds-input", value: this.state.apiVersion.split(".0")[0], onChange: this.onChangeApiVersion }),
        )
      )
    );
  }
}

class APIKeyOption extends React.Component {

  constructor(props) {
    super(props);
    this.onChangeApiKey = this.onChangeApiKey.bind(this);
    this.state = { apiKey: localStorage.getItem(this.sfHost + "_clientId") };
  }

  onChangeApiKey(e) {
    let apiKey = e.target.value;
    this.setState({apiKey: apiKey});
    localStorage.setItem(this.sfHost + "_clientId", apiKey);
  }

  render() {
    return h("div", { className: "slds-grid slds-border_bottom slds-p-horizontal_small slds-p-vertical_xx-small" },
      h("div", { className: "slds-col slds-size_4-of-12 text-align-middle"},
        h("span", {}, "API Consumer Key")
      ),
      h("div", { className: "slds-col slds-size_8-of-12 slds-form-element slds-grid slds-grid_align-end slds-grid_vertical-align-center slds-gutters_small" },
      h("div", { className: "slds-form-element__control slds-col slds-size_8-of-12" },
      h("input", { type: "text", id: "apiKeyInput", className: "slds-input", placeholder: "Consumer Key", value: this.state.apiKey, onChange: this.onChangeApiKey }),
        )
      )
    );
  }
}

let h = React.createElement;

class App extends React.Component {

  constructor(props) {
    super(props);
    this.foo = undefined;
  }

  render() {
    let { model } = this.props;
    return h("div", {},
      h("div", { id: "user-info", className: "slds-border_bottom" },
        h("a", { href: model.sfLink, className: "sf-link" },
          h("svg", { viewBox: "0 0 24 24" },
            h("path", { d: "M18.9 12.3h-1.5v6.6c0 .2-.1.3-.3.3h-3c-.2 0-.3-.1-.3-.3v-5.1h-3.6v5.1c0 .2-.1.3-.3.3h-3c-.2 0-.3-.1-.3-.3v-6.6H5.1c-.1 0-.3-.1-.3-.2s0-.2.1-.3l6.9-7c.1-.1.3-.1.4 0l7 7v.3c0 .1-.2.2-.3.2z" })
          ),
          " Salesforce Home"
        ),
        h("h1", { className: "slds-text-title_bold" }, "Salesforce Inspector Options"),
        h("div", { className: "flex-right" })),
      h("div", { className: "main-container slds-card slds-m-around_x-small" },
        h(OptionsTabSelector, {}))
    );
  }
}


{

  let args = new URLSearchParams(location.search.slice(1));
  let sfHost = args.get("host");
  initButton(sfHost, true);
  sfConn.getSession(sfHost).then(() => {

    let root = document.getElementById("root");
    let model = new Model(sfHost);
    model.reactCallback = cb => {
      ReactDOM.render(h(App, { model }), root, cb);
    };
    ReactDOM.render(h(App, { model }), root);

    if (parent && parent.isUnitTest) { // for unit tests
      parent.insextTestLoaded({ model });
    }

  });

}
