import React, { Component } from "react";
import { Table, TableData } from "@finos/perspective";
import { ServerRespond } from "./DataStreamer";
import { DataManipulator } from "./DataManipulator";
import "./Graph.css";

interface IProps {
  data: ServerRespond[];
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void;
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement("perspective-viewer");
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = (document.getElementsByTagName(
      "perspective-viewer"
    )[0] as unknown) as PerspectiveViewerElement;

    const schema = {
      // updated schema to track ratio, upper_bound, lower_bound, trigger_alert *aw191
      timestamp: "date",
      price_abc: "float", // necessary to calculate ratio *aw191
      price_def: "float", // necessary to calculate ratio *aw191
      ratio: "float",
      upper_bound: "float",
      lower_bound: "float",
      trigger_alert: "float", // necessary for action when ratio is met *aw191
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute("view", "y_line");
      elem.setAttribute("row-pivots", '["timestamp"]'); // necessary to populate along x axis *aw191
      elem.setAttribute(
        "columns",
        '["ratio","lower_bound","upper_bound","trigger_alert"]'
      ); // populates along y axis *aw191
      // removed column-pivots because we're only tracking ratios now *aw191
      // added attributes to the element *aw191
      elem.setAttribute(
        "aggregates",
        JSON.stringify({
          price_abc: "avg",
          price_def: "avg",
          ratio: "avg",
          timestamp: "distinct count",
          upper_bound: "avg",
          lower_bound: "avg",
          trigger_alert: "avg",
        })
      );
    }
  }

  componentDidUpdate() {
    if (this.table) {
      this.table.update(([
        DataManipulator.generateRow(this.props.data),
      ] as unknown) as TableData);
    }
  }
}

export default Graph;
