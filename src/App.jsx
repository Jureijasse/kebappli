import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

function ClickableMap({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

export default function KebApp() {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem("accounts");
    return saved ? JSON.parse(saved) : [];
  });

  const [kebabs, setKebabs] = useState(() => {
    const saved = localStorage.getItem("kebabs");
    return saved ? JSON.parse(saved) : [];
  });

  const [userReviews, setUserReviews] = useState(() => {
    const saved = localStorage.getItem("userReviews");
    return saved ? JSON.parse(saved) : [];
  });

  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("auth");
    return saved ? JSON.parse(saved) : { email: "", id: "", password: "", loggedIn: false };
  });

  const [stayLoggedIn, setStayLoggedIn] = useState(() => localStorage.getItem("stayLoggedIn") === "true");

  const [view, setView] = useState("login");
  const [mode, setMode] = useState("login");
  const [friends, setFriends] = useState([]);
  const [selectedKebab, setSelectedKebab] = useState(null);
  const [position, setPosition] = useState([48.8566, 2.3522]);
  const [clickPosition, setClickPosition] = useState(null);
  const [newKebabName, setNewKebabName] = useState("");
  const [newFriendId, setNewFriendId] = useState("");
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("kebabs", JSON.stringify(kebabs));
  }, [kebabs]);

  useEffect(() => {
    localStorage.setItem("userReviews", JSON.stringify(userReviews));
  }, [userReviews]);

  useEffect(() => {
    if (stayLoggedIn && auth.loggedIn) {
      localStorage.setItem("auth", JSON.stringify(auth));
    } else {
      localStorage.removeItem("auth");
    }
    localStorage.setItem("stayLoggedIn", stayLoggedIn);
  }, [auth, stayLoggedIn]);

  useEffect(() => {
    if (auth.loggedIn && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, [auth.loggedIn]);

  const handleLogin = () => {
    const existing = accounts.find((acc) => acc.id === auth.id);
    if (!existing) return alert("Ce compte n'existe pas !");
    if (existing.email !== auth.email || existing.password !== auth.password)
      return alert("Identifiants incorrects !");
    setAuth({ ...auth, loggedIn: true });
    setUserReviews(existing.reviews || []);
    setFriends(existing.friends || []);
    setView("map");
  };

  const handleRegister = () => {
    if (!auth.id || !auth.email || !auth.password) return alert("Merci de remplir tous les champs !");
    const existing = accounts.find((acc) => acc.id === auth.id);
    if (existing) return alert("Ce compte existe déjà !");
    const newAcc = { id: auth.id, email: auth.email, password: auth.password, reviews: [], friends: [] };
    setAccounts([...accounts, newAcc]);
    setAuth({ ...auth, loggedIn: true });
    setUserReviews([]);
    setFriends([]);
    setView("map");
  };

  const addKebab = () => {
    if (!newKebabName.trim()) return alert("Merci de donner un nom au kebab");
    const newKebab = {
      id: Date.now(),
      name: newKebabName.trim(),
      position: [clickPosition.lat, clickPosition.lng],
    };
    const updated = [...kebabs, newKebab];
    setKebabs(updated);
    setClickPosition(null);
    setNewKebabName("");
  };

  const handleLogout = () => {
    setAuth({ email: "", id: "", password: "", loggedIn: false });
    setUserReviews([]);
    setSelectedKebab(null);
    setView("login");
    setFriends([]);
    localStorage.removeItem("auth");
  };

  return (
    <div className="h-screen w-screen bg-orange-100 flex flex-col font-sans overflow-hidden">
      <div className="text-center text-4xl font-bold p-4 text-orange-700">Keb'app</div>

      {auth.loggedIn && (
        <div className="fixed top-0 left-0 w-full z-10 bg-orange-200 flex gap-2 p-2">
          <Button onClick={() => setView("map")}>Carte</Button>
          <Button onClick={() => setView("favorites")}>Mes avis</Button>
          <Button onClick={() => setView("friends")}>Mes amis</Button>
          <Button onClick={handleLogout} className="ml-auto bg-red-500 hover:bg-red-600">
            Déconnexion
          </Button>
        </div>
      )}

      {!auth.loggedIn && view === "login" && (
        <div className="flex flex-col items-center justify-center flex-1 bg-orange-100 p-4">
          <input placeholder="Identifiant" className="mb-2 border p-2 rounded" value={auth.id} onChange={(e) => setAuth({ ...auth, id: e.target.value })} />
          <input placeholder="Email" className="mb-2 border p-2 rounded" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
          <input type="password" placeholder="Mot de passe" className="mb-2 border p-2 rounded" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
          <label className="mb-2 text-sm">
            <input type="checkbox" className="mr-2" checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)} />
            Rester connecté
          </label>
          {mode === "login" ? (
            <>
              <Button onClick={handleLogin}>Connexion</Button>
              <button className="mt-2 text-sm text-orange-700 underline" onClick={() => setMode("register")}>Un petit nouveau ?</button>
            </>
          ) : (
            <>
              <Button onClick={handleRegister}>Créer mon compte</Button>
              <button className="mt-2 text-sm text-orange-700 underline" onClick={() => setMode("login")}>Déjà inscrit ?</button>
            </>
          )}
        </div>
      )}

      {auth.loggedIn && view === "map" && (
        <MapContainer
          key={kebabs.length}
          center={position}
          zoom={13}
          style={{ height: "calc(100vh - 110px)", width: "100%", marginTop: "60px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {kebabs.map((kebab) => (
            <Marker
              key={kebab.id}
              position={kebab.position}
              eventHandlers={{ click: () => setSelectedKebab(kebab) }}
            >
              <Popup>{kebab.name}</Popup>
            </Marker>
          ))}
          <ClickableMap onClick={(pos) => setClickPosition(pos)} />
        </MapContainer>
      )}

      {clickPosition && (
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "white",
            padding: 15,
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            zIndex: 1000,
            width: 300,
          }}
        >
          <h3>Ajouter un kebab ici ?</h3>
          <input
            placeholder="Nom du kebab"
            value={newKebabName}
            onChange={(e) => setNewKebabName(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />
          <div>
            <Button onClick={addKebab}>Ajouter</Button>
            <Button onClick={() => setClickPosition(null)} className="bg-gray-400 ml-2">
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
