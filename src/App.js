import React, { useRef } from "react"
import UploadPictures from "./package/src/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";


function App() {
  const childRef = useRef(null);

  const setOpen = (open) => {
    console.log(childRef);
  }

  const savePictures = (pictures) => {
    console.log(pictures);
  }
  return (
    <div className="App">
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <FontAwesomeIcon icon={faDownload} />
      </button>
      <UploadPictures
        ref={childRef}
        title="upload pictures"
        isOpen={false}
        imgExtension={['.jpg', '.jpeg', '.gif', '.png']}
        maxFileSize={5242880}
        height="200px"
        width="200px"
        sizModal="modal-xl"
        iconSize="lg"
        drag={true}
        crop={true}
        savePictures={savePictures}
      />
    </div>
  )
}

export default App;
