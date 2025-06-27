import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "./supabaseClient";

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
  // Auth + user data
  const [auth, setAuth] = useState({
    id: "",
    email: "",
    password: "",
    loggedIn: false,
  });

  const [userData, setUserData] = useState(null); // données complètes de l'utilisateur

  // Vue courante : login, register, map, friends, favorites
  const [view, setView] = useState("login");
  const [mode, setMode] = useState("login");

  // Position GPS
  const [position, setPosition] = useState([48.8566, 2.3522]);

  // Kebab
  const [kebabs, setKebabs] = useState([]);
  const [clickPosition, setClickPosition] = useState(null);
  const [newKebabName, setNewKebabName] = useState("");
  const [selectedKebab, setSelectedKebab] = useState(null);

  // Avis
  const [newReviewText, setNewReviewText] = useState("");

  // Amis
  const [friends, setFriends] = useState([]);
  const [newFriendId, setNewFriendId] = useState("");

  // --- Gestion géoloc ---
  useEffect(() => {
    if (auth.loggedIn && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, [auth.loggedIn]);

  // --- Charger kebabs ---
  useEffect(() => {
    if (auth.loggedIn) {
      supabase
        .from("kebabs")
        .select("*")
        .then(({ data, error }) => {
          if (error) {
            alert("Erreur en récupérant les kebabs !");
            return;
          }
          setKebabs(data);
        });
    }
  }, [auth.loggedIn]);

  // --- Charger utilisateur complet (reviews, friends) ---
  useEffect(() => {
    if (auth.loggedIn) {
      supabase
        .from("Utilisateur")
        .select("*")
        .eq("id", auth.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            alert("Erreur en récupérant les données utilisateur.");
            return;
          }
          setUserData(data);
          setFriends(data.friends || []);
        });
    } else {
      setUserData(null);
      setFriends([]);
    }
  }, [auth.loggedIn, auth.id]);

  // --- Inscription ---
  const handleRegister = async () => {
    if (!auth.id || !auth.email || !auth.password) {
      alert("Merci de remplir tous les champs !");
      return;
    }

    // Vérifier si utilisateur existe déjà
    const { data: existingUser, error: fetchError } = await supabase
      .from("Utilisateur")
      .select("*")
      .eq("id", auth.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      alert("Erreur lors de la vérification du compte : " + fetchError.message);
      return;
    }
    if (existingUser) {
      alert("Ce compte existe déjà !");
      return;
    }

    // Créer utilisateur
    const { data, error } = await supabase.from("Utilisateur").insert([
      {
        id: auth.id,
        email: auth.email,
        password: auth.password,
        reviews: [],
        friends: [],
      },
    ]);

    if (error) {
      alert("Erreur lors de la création du compte : " + error.message);
      return;
    }

    setAuth({ ...auth, loggedIn: true });
    setUserData(data[0]);
    setFriends([]);
    setView("map");
  };

  // --- Connexion ---
  const handleLogin = async () => {
    if (!auth.id || !auth.email || !auth.password) {
      alert("Merci de remplir tous les champs !");
      return;
    }

    const { data, error } = await supabase
      .from("Utilisateur")
      .select("*")
      .eq("id", auth.id)
      .single();

    if (error || !data) {
      alert("Compte non trouvé.");
      return;
    }

    if (data.email !== auth.email || data.password !== auth.password) {
      alert("Identifiants incorrects !");
      return;
    }

    setAuth({ ...auth, loggedIn: true });
    setUserData(data);
    setFriends(data.friends || []);
    setView("map");
  };

  // --- Déconnexion ---
  const handleLogout = () => {
    setAuth({ id: "", email: "", password: "", loggedIn: false });
    setUserData(null);
    setFriends([]);
    setView("login");
    setSelectedKebab(null);
  };

  // --- Ajouter un kebab ---
  const addKebab = async () => {
    if (!newKebabName.trim()) {
      alert("Merci de donner un nom au kebab");
      return;
    }

    if (!clickPosition) {
      alert("Merci de sélectionner un emplacement sur la carte");
      return;
    }

    const { data, error } = await supabase
      .from("kebabs")
      .insert([
        {
          name: newKebabName.trim(),
          lat: clickPosition.lat,
          lng: clickPosition.lng,
        },
      ])
      .select();

    if (error) {
      alert("Erreur en ajoutant le kebab : " + error.message);
      return;
    }

    setKebabs([...kebabs, ...data]);
    setClickPosition(null);
    setNewKebabName("");
  };

  // --- Ajouter un avis ---
  const addReview = async () => {
    if (!selectedKebab) {
      alert("Sélectionnez un kebab pour ajouter un avis");
      return;
    }
    if (!newReviewText.trim()) {
      alert("Merci d'écrire un avis");
      return;
    }

    // Construire un nouvel avis
    const review = {
      kebabId: selectedKebab.id,
      text: newReviewText.trim(),
      date: new Date().toISOString(),
    };

    // Mettre à jour les reviews dans userData
    const updatedReviews = [...(userData.reviews || []), review];

    // Mettre à jour dans Supabase
    const { data, error } = await supabase
      .from("Utilisateur")
      .update({ reviews: updatedReviews })
      .eq("id", auth.id)
      .select()
      .single();

    if (error) {
      alert("Erreur lors de l'ajout de l'avis : " + error.message);
      return;
    }

    // Mise à jour locale
    setUserData({ ...userData, reviews: updatedReviews });
    setNewReviewText("");
    alert("Avis ajouté !");
  };

  // --- Ajouter un ami ---
  const addFriend = async () => {
    if (!newFriendId.trim()) {
      alert("Merci de saisir l'identifiant de l'ami");
      return;
    }
    if (newFriendId.trim() === auth.id) {
      alert("Vous ne pouvez pas vous ajouter vous-même.");
      return;
    }

    // Vérifier que l'ami existe
    const { data: friendData, error: friendError } = await supabase
      .from("Utilisateur")
      .select("id,email")
      .eq("id", newFriendId.trim())
      .single();

    if (friendError || !friendData) {
      alert("Aucun utilisateur trouvé avec cet identifiant.");
      return;
    }

    // Vérifier si déjà ami
    const alreadyFriend = (friends || []).some((f) => f.id === newFriendId.trim());
    if (alreadyFriend) {
      alert("Cet utilisateur est déjà dans votre liste d'amis.");
      return;
    }

    const updatedFriends = [...friends, { id: friendData.id, email: friendData.email }];

    // Mettre à jour dans Supabase
    const { data, error } = await supabase
      .from("Utilisateur")
      .update({ friends: updatedFriends })
      .eq("id", auth.id)
      .select()
      .single();

    if (error) {
      alert("Erreur lors de l'ajout de l'ami : " + error.message);
      return;
    }

    setFriends(updatedFriends);
    setNewFriendId("");
    alert("Ami ajouté !");
  };

  // --- Rendu principal ---
  return (
    <div className="h-screen w-screen bg-orange-100 flex flex-col font-sans overflow-hidden">
      <div className="text-center text-4xl font-bold p-4 text-orange-700">
        Keb'app
      </div>

      {auth.loggedIn && (
        <div className="fixed top-0 left-0 w-full z-10 bg-orange-200 flex gap-2 p-2">
          <Button onClick={() => setView("map")}>Carte</Button>
          <Button onClick={() => setView("favorites")}>Mes avis</Button>
          <Button onClick={() => setView("friends")}>Mes amis</Button>
          <Button
            onClick={handleLogout}
            className="ml-auto bg-red-500 hover:bg-red-600"
          >
            Déconnexion
          </Button>
        </div>
      )}

      {/* LOGIN & REGISTER */}
      {!auth.loggedIn && view === "login" && (
        <div className="flex flex-col items-center justify-center flex-1 bg-orange-100 p-4">
          <input
            placeholder="Identifiant"
            className="mb-2 border p-2 rounded"
            value={auth.id}
            onChange={(e) => setAuth({ ...auth, id: e.target.value })}
          />
          <input
            placeholder="Email"
            className="mb-2 border p-2 rounded"
            value={auth.email}
            onChange={(e) => setAuth({ ...auth, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="mb-2 border p-2 rounded"
            value={auth.password}
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
          />
          {mode === "login" ? (
            <>
              <Button onClick={handleLogin}>Connexion</Button>
              <button
                className="mt-2 text-sm text-orange-700 underline"
                onClick={() => setMode("register")}
              >
                Un petit nouveau ?
              </button>
            </>
          ) : (
            <>
              <Button onClick={handleRegister}>Créer mon compte</Button>
              <button
                className="mt-2 text-sm text-orange-700 underline"
                onClick={() => setMode("login")}
              >
                Déjà inscrit ?
              </button>
            </>
          )}
        </div>
      )}

      {/* MAP VIEW */}
      {auth.loggedIn && view === "map" && (
        <>
          <MapContainer
            key={kebabs.length}
            center={position}
            zoom={13}
            style={{
              height: "calc(100vh - 110px)",
              width: "100%",
              marginTop: "60px",
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {kebabs.map((kebab) => (
              <Marker
                key={kebab.id}
                position={[kebab.lat, kebab.lng]}
                eventHandlers={{
                  click: () => setSelectedKebab(kebab),
                }}
              >
                <Popup>{kebab.name}</Popup>
              </Marker>
            ))}
            <ClickableMap onClick={(pos) => setClickPosition(pos)} />
          </MapContainer>

          {/* Ajouter kebab */}
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
                <Button
                  onClick={() => setClickPosition(null)}
                  className="bg-gray-400 ml-2"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Ajouter un avis */}
          {selectedKebab && (
            <div
              style={{
                position: "absolute",
                bottom: 120,
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
              <h3>Ajouter un avis pour {selectedKebab.name}</h3>
              <textarea
                rows={3}
                placeholder="Votre avis..."
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                style={{ width: "100%", marginBottom: 10, padding: 8 }}
              />
              <div>
                <Button onClick={addReview}>Envoyer</Button>
                <Button
                  onClick={() => setSelectedKebab(null)}
                  className="bg-gray-400 ml-2"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VUE MES AVIS */}
      {auth.loggedIn && view === "favorites" && (
        <div className="p-4 flex flex-col gap-4 overflow-auto" style={{flex: 1}}>
          <h2 className="text-xl font-bold mb-4">Mes avis</h2>
          {userData && userData.reviews && userData.reviews.length > 0 ? (
            userData.reviews.map((rev, i) => {
              const kebab = kebabs.find((k) => k.id === rev.kebabId);
              return (
                <div
                  key={i}
                  className="border p-2 rounded bg-white shadow-sm"
                >
                  <b>{kebab ? kebab.name : "Kebab inconnu"}</b>
                  <p>{rev.text}</p>
                  <small>{new Date(rev.date).toLocaleString()}</small>
                </div>
              );
            })
          ) : (
            <p>Aucun avis pour l’instant.</p>
          )}
        </div>
      )}

      {/* VUE AMIS */}
      {auth.loggedIn && view === "friends" && (
        <div className="p-4 flex flex-col gap-4 overflow-auto" style={{flex: 1}}>
          <h2 className="text-xl font-bold mb-4">Mes amis</h2>
          <div className="flex gap-2 mb-4">
            <input
              placeholder="Ajouter un ami par identifiant"
              value={newFriendId}
              onChange={(e) => setNewFriendId(e.target.value)}
              className="border p-2 rounded flex-grow"
            />
            <Button onClick={addFriend}>Ajouter</Button>
          </div>
          {friends.length > 0 ? (
            friends.map((f) => (
              <div key={f.id} className="border p-2 rounded bg-white shadow-sm">
                <b>{f.id}</b> — {f.email}
              </div>
            ))
          ) : (
            <p>Vous n’avez pas encore d’amis.</p>
          )}
        </div>
      )}
    </div>
  );
}
