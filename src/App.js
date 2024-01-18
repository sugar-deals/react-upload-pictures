import React, { useRef, useState } from "react"
import UploadPictures from "./package/src/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

function App() {
  const ref = useRef();
  const [open, setOpen] = useState(false)


  const savePictures = (pictures) => {
    console.log(pictures);
    setOpen(false)
  }
  return (
    <div className="App">
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <FontAwesomeIcon icon={faDownload} />
      </button>

      {
        open && (
          <div className="modal modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable fade show" tabIndex="-1" id="exampleModalLive">
            <div className="modal-dialog">
              <div className="modal-content p-2">
                <UploadPictures
                  ref={ref}
                  title="upload pictures"
                  isOpen={false}
                  imgExtension={['.jpg', '.jpeg', '.gif', '.png']}
                  maxFileSize={5242880}
                  height="100px"
                  width="100px"
                  sizModal="modal-xl"
                  iconSize="lg"
                  drag={true}
                  crop={true}
                  instructions="<ul><li>Preferred size: 750x800</li><li>Aspect ratio 15x16</li><li>Max size: 10MB</li><li>max number: 20</li>"
                  savePictures={savePictures}
                  multiple={true}
                  aspect={15 / 16}
                  handelClose= { () => setOpen(false)}
                />
              </div>
            </div>
          </div>
        )
      }
      {
        open && (
          <div className="modal-backdrop fade show"></div>
        )
      }

    </div>
  )
}

export default App;
