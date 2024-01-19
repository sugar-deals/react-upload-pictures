import React, { useRef, useState } from "react";
import { Button, Modal } from 'react-bootstrap';
import UploadPictures from "./package/src/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

function App() {
  const ref = useRef();
  const [open, setOpen] = useState(false)

  const submitForm = () => {
    ref.current.sendPictures();

  }


  const savePictures = (pictures) => {

    //make a POST with pictures and other parameters


    console.log(pictures);
    setOpen(false);
  }
  return (
    <div className="App">
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <FontAwesomeIcon icon={faDownload} />
      </button>

      {
        open && (
             <Modal
                show={open}
                onHide={()=>setOpen(false)}
                size="xl"
                keyboard={true}>
                <Modal.Header closeButton>
                  <Modal.Title>Upload Images</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UploadPictures
                      ref={ref}
                      isOpen={false}
                      imgExtension={['.jpg', '.jpeg', '.gif', '.png']}
                      maxFileSize={5242880}
                      height="100px"
                      width="100px"
                      iconSize="lg"
                      drag={true}
                      crop={true}
                      instructions="<ul><li>Preferred size: 750x800</li><li>Aspect ratio 15x16</li><li>Max size: 10MB</li><li>max number: 20</li>"
                      savePictures={savePictures}
                      multiple={true}
                      aspect={15 / 16}
                      handelClose= { () => setOpen(false)}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                    <Button variant="primary" className="text-white" onClick={() => submitForm()}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
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
