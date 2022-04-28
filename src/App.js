import * as THREE from "three";
import React, { Suspense, useEffect, useState, useParams } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Html, Preload, OrbitControls } from "@react-three/drei";
import { Popconfirm } from "antd";
import "antd/dist/antd.css";
import { getGCSSignedURL, getTourDetails360 } from "./services/ApiService";

const store = [
  {
    name: "Next",
    color: "lightpink",
    position: [10, 0, -15],
    url: "/viceroy-los-cabos_medium_29 Public Spaces - Otro Bar.jpg",
    link: 1
  },
  {
    name: "Next",
    color: "lightblue",
    position: [15, 0, 0],
    url: "/viceroy-los-cabos_medium_08 Accommodations - Three Bedroom Villa - Roof 2.jpg",
    link: 2
  },
  {
    name: "Next",
    color: "lightblue",
    position: [15, 0, 0],
    url: "/viceroy-los-cabos_medium_22 Public Spaces - Family Pool Deck - Main Pool Deck.jpg",
    link: 0
  }
  // ...
];

function Dome({ name, position, texture, onClick }) {
  return (
    <group>
      <mesh>
        <sphereBufferGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>
      <mesh position={position}>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial color="white" />
        <Html center>
          <Popconfirm
            title="Are you sure you want to leave?"
            onConfirm={onClick}
            okText="Yes"
            cancelText="No"
          >
            <a href="#">{name}</a>
          </Popconfirm>
        </Html>
      </mesh>
    </group>
  );
}

function Portals({ setReset }) {
  const [which, set] = useState(0);
  const { link, ...props } = store[which];
  const maps = useLoader(THREE.TextureLoader, store.map((entry) => entry.url)) // prettier-ignore
  return (
    <Dome
      onClick={() => {
        setReset((prev) => !prev);
        setTimeout(() => {
          set(link);
          setTimeout(() => {
            setReset((prev) => !prev);
          }, 500);
        }, 500);
      }}
      {...props}
      texture={maps[which]}
    />
  );
}

function App({ ...props }) {
  const [reset, setReset] = useState(false);

  // Get JSON DATA 
  const { id } = useParams();
  const [selectedScene, setSelectedScene] = useState({});
  const [tourScenes, setTourScenes] = useState([]);
  const [tourConfig, setTourConfig] = useState({});
  const defaultConfig = {
    autoRotate: 0,
    autoLoad: true,
    pitch: 0,
    hfov: 120,
    haov: props.isFlatView ? 120 : 360,
    vaov: props.isFlatView ? 110 : 180,
    showZoomCtrl: true,
    author: "VMCMS",
    compass: false,
    draggable: props.isFlatView ? false : true,
    type: "equirectangular",
    zoom: 0,
    flatView: false,
    hotSpotDebug: false,
    showControls: props.hideControls ? false : false,
    disableKeyboardCtrl: true,
    styles: {
      width: `100%`,
      height: "400px",
      background: "#000000"
    },
  }

  useEffect(() => {
    getTourDetails360ByEncrypt(id);
  }, [id]);


  // get tour 360 by encrypted tourId
  const getTourDetails360ByEncrypt = (id) => {
    let payload = {
      encId: id,
    };
    let apiCall = getTourDetails360;

    payload = {
      tourId: id,
    }
    apiCall(payload).then(async (res) => {
      const data = res.data && res.data.data ? res.data.data : null;
      if (data) {

        const newTourConfig = JSON.parse(data);

        if (data !== "false" && data !== null && data !== "") {
          const scenesData = newTourConfig.length !== 0 && newTourConfig;
          const scenes = await getURLForScene(scenesData);
          if (scenes) {
            const config = {
              ...defaultConfig,
              scenes
            }
            setTourConfig(config);

            let findIndex = Object.keys(config.scenes).findIndex(key => config.scenes[key].selectedDefault);
            if (findIndex < 0) {
              findIndex = 0;
            }
            Object.keys(config.scenes).length != 0 ? setSelectedScene(config.scenes[Object.keys(config.scenes)[findIndex]]) : setSelectedScene({});

            if (Object.keys(config.scenes).length != 0) {
              const sceneList = config.scenes && Object.keys(config.scenes).map(sceneId => {
                return config.scenes[sceneId]
              })
              setTourScenes(sceneList)
            }
          } else {
            const config = {
              ...defaultConfig,
              scenes: {},
            }
            setTourConfig(config);
            setSelectedScene({})
          }
        }
      }
    })
      .catch((err) => {
        //   const message = (err && err.data) ? err.data.error || err.data.message : Enums.INTERNAL_SERVER_ERROR;
      })

  };

  //get GCS Signed URL for scenes
  const getURLForScene = async (scenesData) => {
    let payload = {};
    let sceneArray = [];
    scenesData.forEach((scene) => {
      sceneArray.push({
        sceneId: scene.sceneId,
        sceneUrl: scene.imageSource,
        customerId: scene.customerId._id || scene.customerId || scene.localSceneCustomerId
      })
    })
    payload = {
      scenes: sceneArray
    }

    let newSceneList = [...scenesData];
    const res = await getGCSSignedURL(payload)
    // .then((res) => {
    const data = res && res.data ? res.data : {}
    let resSceneArray = data.url;

    await Promise.all(newSceneList.map(async (scene) => {
      let url = resSceneArray.find((ele) => ele.id === scene.sceneId).signedUrlMedium;
      scene.imageSource = url;
      scene.hotSpots = scene.hotSpots.length > 0 ? await getURLForHotspotScene(scene, scene.hotSpots, scene.customerId) : []
    }));

    return convertArrayToObject(newSceneList, 'sceneId');
  };

  //get GCS Signed URL for Hotspot scene
  const getURLForHotspotScene = async (scene, hotspots, cId) => {
    let payload = {};
    let hotspotsArray = [];

    for (const htScene of hotspots) {
      if (htScene && htScene.createTooltipArgs && htScene.createTooltipArgs.scene && htScene.createTooltipArgs.scene.id !== scene.sceneId) {
        hotspots.forEach((index) => {
          if (index?.createTooltipArgs?.scene && (index?.createTooltipArgs?.scene?.url || index?.createTooltipArgs?.scene?.urlMedium)) {
            hotspotsArray.push({
              sceneId: index.createTooltipArgs.scene._id,
              sceneUrl: index.createTooltipArgs.scene.url || index.createTooltipArgs.scene.urlMedium,
              customerId: index.createTooltipArgs.scene.customerId?._id || index.createTooltipArgs.scene.customerId || index.createTooltipArgs.scene.localSceneCustomerId || cId
            })
          }
        });
        if (hotspotsArray.length > 0) {
          payload = {
            scenes: hotspotsArray
          }
          let newHotspots = [...hotspots];
          const res = await getGCSSignedURL(payload)
          const data = res && res.data ? res.data : {}
          let resHotspotsArray = data.url;

          newHotspots.forEach((index) => {
            if (index?.createTooltipArgs?.scene) {
              index.createTooltipArgs.scene.url = resHotspotsArray.find((ele) => (ele.id === index.createTooltipArgs.scene._id)).signedUrl;
              index.createTooltipArgs.scene.urlMedium = resHotspotsArray.find((ele) => (ele.id === index.createTooltipArgs.scene._id)).signedUrlMedium;
            }
          })
          return newHotspots;
        } else {
          return [];
        }
      } else {
        return hotspots;
      }
    }
  };

  //conver array into obj
  const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
      return {
        ...obj,
        [item[key]]: item,
      };
    }, initialValue);
  };

  return (
    <Canvas
      style={{ opacity: reset ? "0.1" : "1", transition: "0.5s all linear" }}
      frameloop="demand"
      camera={{ position: [0, 0, 0.1] }}
    >
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.2}
        autoRotate={false}
        rotateSpeed={-0.5}
      />
      <Suspense fallback={null}>
        <Preload all />
        <Portals setReset={setReset} />
      </Suspense>
    </Canvas>
  );
}

export default App;