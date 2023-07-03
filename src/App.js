import React, { useRef } from "react"
import UploadPictures from "./package/src/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

function App() {
  const ref = useRef();

  const setOpen = (open) => {
    ref.current.openModal(open)
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
        ref={ref}
        title="upload pictures"
        isOpen={false}
        imgExtension={['.jpg', '.jpeg', '.gif', '.png']}
        maxFileSize={5242880}
        height="213px"
        width="200px"
        sizModal="modal-xl"
        iconSize="lg"
        drag={true}
        crop={true}
        instructions= "<ul><li>Preferred size: 750x800</li><li>Aspect ratio 15x16</li><li>Max size: 10MB</li><li>max number: 20</li>"
        savePictures={savePictures}
        multiple={true}
        aspect= {15/16}
      />
    </div>
  )
}

export default App;
