import React, {useCallback, useState, forwardRef, useImperativeHandle, useEffect} from "react"
import { Button } from 'react-bootstrap';
import ApiCall from './Helper/ApiCall.js';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import { LazyLoadImage } from "react-lazy-load-image-component";

import "../assets/style/index.scss"


const ERROR = {
  NOT_SUPPORTED_EXTENSION: 'NOT_SUPPORTED_EXTENSION',
  FILE_SIZE_TOO_LARGE: 'FILE_SIZE_TOO_LARGE',
  DIMENSION_IMAGE: "DIMENSION_IMAGE"
}

const LoadingIndicator = () => (
    <div className="d-flex justify-content-center mt-3">
      <div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
)

const SocialMediaImportPopup = forwardRef((
  {
    title = null,
    modalSource = null,
    height = "200px",
    width = "200px",
    classStyle = "",
    iconSize = "lg",
    handleClose = () => { },
    setPhotosCallback = () => { },
    token = '',

  },
  ref
) => {
  useImperativeHandle(ref, () => ({
    getErrors() {
      return [];
    },
    getPictures() {
      return pictures;
    },
  }));
  const [pictures, setPictures] = useState([]);
  const [selected, setSelected] = useState([]);
  const [currentToken, setCurrentToken] = useState(token);

  const [loading, setLoading] = useState(false)

  const readTokenAndTimestamp = useCallback(() => {
    const rawData = localStorage.getItem(`${modalSource}Token`);

    if (!rawData) {
      return [null, null];
    }

    const pieces = rawData.split('-');
    const accessToken = pieces?.[0];
    const timestamp = parseInt(pieces?.[1]);

    if (Date.now() - timestamp > 3598 * 1000) {
      localStorage.removeItem(`${modalSource}Token`);
      return [null, null]
    }

    return [accessToken, timestamp];
  }, [modalSource]);

  const setTokenAndTimestamp = useCallback((accessToken) => {
    localStorage.setItem(`${modalSource}Token`, `${accessToken}-${Date.now()}`);
    setCurrentToken(accessToken);
  }, [modalSource]);

  const getInstagramAccessCode = () => {
    const params = new URL(document.location.toString()).searchParams;
    return params.get("code");
  }

  useEffect(() => {
    setPhotosCallback([], []);
    const pieces = readTokenAndTimestamp();
    const accessToken = pieces?.[0];
    const instagramAccessCode = getInstagramAccessCode();

    if (accessToken && !currentToken) {
      setCurrentToken(accessToken);
    } else if (!accessToken && !instagramAccessCode && modalSource === 'instagram') {
      window.location.href = "https://api.instagram.com/oauth/authorize?client_id=" + process.env.REACT_APP_INSTAGRAM_APP_ID + "&redirect_uri=" + window.location.href + "&scope=user_profile,user_media&response_type=code";
    } else if (!accessToken && instagramAccessCode && modalSource === 'instagram') {
      const getAndSetInstagramAccessToken = async (accessCode) => {
        try {
          const result = await ApiCall.post('account/exchangeCode', { accessCode, redirectUri: window.location.href.split('?')[0]});
          if (result) {
            setTokenAndTimestamp(result);
          } else {
            handleClose();
          }
        } catch {
          handleClose();
        }
      }

      getAndSetInstagramAccessToken(instagramAccessCode);
    }

    switch (modalSource) {
      case "facebook":
        FBGetPhotos();
        break;
      case "instagram":
        InstagramGetPhotos();
        break;
    }
  }, [modalSource, currentToken])

  async function fetchFBPic(path, accessToken) {
      const response = await fetch(`https://graph.facebook.com/${path}&access_token=${accessToken}`);
      return await response.json();
  }
  
  async function fetchInstagramPic(accessToken) {
    const userId = await(await fetch(`https://graph.instagram.com/me?fields=id&access_token=${accessToken}`))?.json();
    const response = await fetch(`https://graph.instagram.com/${userId?.id}/media?access_token=${accessToken}`);
    return await response.json();
  }

  const getAlbums = useCallback(async (takeFromFB=true) => {
      const response = takeFromFB ? await fetchFBPic('me/albums?fields=id,name', currentToken) : await fetchInstagramPic(currentToken)
      if(response.data && response.data.length > 0) {
         if (takeFromFB) {
          await response.data.forEach(async album => {
              if(album.name === "Profile pictures") {
                let data = await getPhotosForAlbumId(album.id, currentToken)
                let results = []
                results = data.map((item, index) =>({src: item.source}));
                if (results) {
                  setPictures([...pictures, ...results]);
                }
              }
          })
        } else {
          const results = await Promise.all(response.data.map(async (item, index) =>{
            const data = await getPhotoForInstaPhotoId(item?.id ,currentToken);
            return {src: data?.media_url}
          }));

          if (results) {
            setPictures([...pictures, ...results]);
          }
        }
      }
      setLoading(false);
  }, [[...pictures], currentToken])

  async function getPhotosForAlbumId(albumId, accessToken) {
      const response = await fetchFBPic(`${albumId}/photos?fields=source`, accessToken);
      return await response.data && response.data.length > 0 ? response.data : []
  }

  async function getPhotoForInstaPhotoId(photoId, accessToken) {
    const response = await fetch(`https://graph.instagram.com/${photoId}?access_token=${accessToken}&fields=media_url,permalink`)
    return await response.json();
}

  async function FBGetPhotos() {
    setLoading(true)
    if (currentToken) {
        await getAlbums()
    } else {
      setLoading(false)
    }
  }

  async function InstagramGetPhotos() {
    setLoading(true)
    if (currentToken) {
        await getAlbums(false)
    } else {
      setLoading(false)
    }
  }

  const toggleMarkSelected = useCallback((pos) => {
      let result;

      if (selected.includes(pos)) {
          result = selected.filter(el => el !== pos);
          setSelected(result);
          setPhotosCallback(pictures, result);
      } else {
          result = [...selected, pos];
          setSelected(result);
          setPhotosCallback(pictures, result);
      }
  }, [pictures, selected])

  const responseFacebook = (response) => {
    if (response && response?.accessToken) {
      setTokenAndTimestamp(response.accessToken);
    } else {
      handleClose();
    }
  }

  return (
    <>
      <div ref={ref} style={{minHeight: 480, maxHeight: 800, overflowY: "auto", overflowX: "hidden"}}>
        {
          <div className={classStyle}>
            <div className="upload-content">
              {title !== null ?
                <div className="upload-header">
                  <h1 className="upload-title fs-5">{title}</h1>
                </div>
              : ""}
              {!!selected?.length &&
                  <div className="mb-2">
                    <div className="alert alert-info" role="alert">
                        {`(${selected?.length}) pictures selected`}
                    </div>
                  </div>
              }
              <div className="mb-5 upload-body">
                <div className="row justify-content-center mb-5">
                  <div className="col" style={{width: "auto"}}>
                  </div>
                </div>
                {
                      loading && <LoadingIndicator />
                }

                {!currentToken && modalSource === 'facebook' && (
                  <div className="d-flex justify-content-center" style={{marginTop: 104}}>
                    <FacebookLogin
                      appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                      autoLoad={true}
                      fields="name,email,picture"
                      scope="public_profile,user_friends,user_photos"
                      render={renderProps => (
                        <Button variant="primary" className="text-white" onClick={renderProps.onClick}>Please click here to authorize your Facebook profile</Button>
                      )}
                      callback={responseFacebook} />
                  </div>
                )}
                <div className="row d-flex justify-content-center space-photos">
                  {
                      pictures.length > 0 && (
                        <div className="row d-flex justify-content-center">
                        {
                          pictures.map((picture, index) => (
                            <div 
                             className={`position-relative p-0 mx-2 mb-4 social-media ${selected.includes(index) ? 'selected' : ''}`} 
                             key={index} style={{ width: width, height: height }} 
                             onClick={() => toggleMarkSelected(index)}
                            >
                              <ImageDisplay picture={picture} height={height} width={width} className="mb-4" />
                            </div>
                          ))
                        }
                      </div>
                    )
                  }
                </div>
              </div>

            </div>
          </div>
        }
      </div>
    </>
  )
})

function ImageDisplay({ picture, width, height }) {
  return <LazyLoadImage src={picture.src} style={{
    height: height,
    width: width,
  }} alt="Social media picture" effect="opacity" width={width} height={height} placeholder={<LoadingIndicator />} />
}

export default SocialMediaImportPopup;
