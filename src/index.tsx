import * as React from "react";
import { Tree } from "./model/tree";

export const Extension = (props: { tree: Tree; resource: Object }) => {
  console.log(props);

  return (
    <div>
        <span>Placeholder</span>
    </div>
  );
};

export const component = Extension;
