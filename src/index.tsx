import * as React from "react";
import Chat from "./components/chat";

export const Extension = (props: any) => {

  const { resource, application } = props;

  console.log("Index Application");
  console.log(application);

  return (
    <div style = {{height:"100vh"}}>
        <Chat resource={resource} application={application}/>
    </div>
  );
};

export const component = Extension;

((window: any) => {
    window?.extensionsAPI?.registerResourceExtension(component, '**', '*', 'Lightspeed', {icon: 'fa-sharp fa-light fa-bars-progress fa-lg'});
})(window);
