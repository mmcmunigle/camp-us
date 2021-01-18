import React from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { formatRelative } from "date-fns"
import mapStyle from "./mapStyles";
import { useLocalStore, useObserver } from "mobx-react";

import usePlacesAutocomplete, {getGeocode, getLatLng} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

require('dotenv').config();

// Defining these as consts help reduce unwanted re-rendering
const libraries = ["places"];
const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
}
const center = {
  lat: 34.052235,
  lng: -118.243683,
}
const options = {
  styles: mapStyle,
  disableDefaultUI: true,
  zoomControl: true,
  terainControl: true,
}

export default function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_KEY,
    libraries,
  });

  // Use state when you want re-renders

  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const onMapClick = React.useCallback((event) => {
    setMarkers((current) => [...current, {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      time: new Date(),
    },
  ]);
  }, []);

  // Mantain state without causing re-renders
  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({lat, lng}) => {
    mapRef.current.panTo({lat, lng});
    mapRef.current.setZoom(12);
  }, []);

  if (loadError) return "Error Loading Maps";
  if (!isLoaded) return "Loading Maps";

  return (
    <div>
      <h1>
        Adventure Time{" "}
        <span role="img" aria-label="tent"> 
          ⛺
        </span>
      </h1>

      <Search panTo={panTo}/>

      <GoogleMap 
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {markers.map((marker) => 
          <Marker
            key={marker.time.toISOString()}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => {
              setSelected(marker);
            }}
          />
        )}

        {selected ? (
          <InfoWindow 
            position={{ lat: selected.lat, lng: selected.lng }} 
            onCloseClick={() => {
              setSelected(null);
            }}
          >
            <div>
              <h2>Adventure Happened Here!</h2>
              <p>{formatRelative(selected.time, new Date())}!</p>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}


function Search({ panTo }) {
  const {ready, value, suggestions: {status, data}, setValue, clearSuggestions} = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 34.052235,  lng: () =>-118.243683 },
      radius: 200 * 1000,
    }
  })

  return (
    <div className="search">
      <Combobox 
        onSelect={async (address) => {
          setValue(address, false);
          clearSuggestions();

          try {
            const results = await getGeocode({address});
            const { lat, lng } = await getLatLng(results[0]);
            panTo({lat, lng});
          } catch(error) {
            console.log(error);
          }
        }}
      >
     <ComboboxInput 
      value={value} 
      onChange={(event) => {
        setValue(event.target.value);
      }}
      disabled={!ready}
      placeholder="Enter an address"
    >
     </ComboboxInput>
     <ComboboxPopover>
       <ComboboxList>
        {status === 'OK' && data.map(({id, description}) => (
          <ComboboxOption key={id} value={description}></ComboboxOption>
        ))}
       </ComboboxList>
     </ComboboxPopover>
    </Combobox>
    </div>

  );
}




