import * as React from "react";
import { Tree } from "./model/tree";
import Chat from "./components/chat";

export const Extension = (props: { tree: Tree; resource: Object }) => {
  console.log(props);

  return (
    <div style = {{height:"100vh"}}>
        <Chat/>
    </div>
  );
};

export const component = Extension;

((window: any) => {
    window?.extensionsAPI?.registerResourceExtension(component, '**', '*', 'Lightspeed', {icon: 'fa-sharp fa-light fa-bars-progress fa-lg'});
})(window);
