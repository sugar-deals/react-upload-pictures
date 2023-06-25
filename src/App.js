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
        height="200px"
        width="200px"
        sizModal="modal-xl"
        iconSize="lg"
        drag={true}
        crop={true}
        savePictures={savePictures}
        multiple={false}
      />
    </div>
  )
}

export default App;
