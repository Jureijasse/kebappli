import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const initialKebabs = [];

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
    return saved ? JSON.parse(saved) : initialKebabs;
  });

  const [userReviews, setUserReviews] = useState(() => {
    const saved = localStorage.getItem("userReviews");
    return saved ? JSON.parse(saved) : [];
  });

  const [auth, setAuth] = useState({ email: "", id: "", password: "", loggedIn: false });
  const [view, setView] = useState("login");
  const [mode, setMode] = useState("login");

  const [friends, setFriends] = useState([
    { id: "octave", name: "Octave", reviews: [{ kebabId: 1, note: 4, text: "Top !" }] },
    { id: "ilias", name: "Ilias", reviews: [{ kebabId: 2, note: 5, text: "Incroyable sauce blanche" }] },
  ]);

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
    if (auth.loggedIn) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
          () => {}
        );
      }
    }
  }, [auth.loggedIn]);

  const handleLogin = () => {
    const existing = accounts.find((acc) => acc.id === auth.id);
    if (!existing) return alert("Ce compte n'existe pas !");
    if (existing.email !== auth.email || existing.password !== auth.password)
      return alert("Identifiants incorrects !");
    setAuth({ ...auth, loggedIn: true });
    setUserReviews(existing.reviews || []);
    setFriends(existing.friends || friends);
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

  const handleLoginOrRegister = () => {
    mode === "login" ? handleLogin() : handleRegister();
  };

  const handleMapClick = (latlng) => {
    setClickPosition(latlng);
    setNewKebabName("");
  };

  const addKebab = () => {
    if (!newKebabName.trim()) return alert("Merci de donner un nom au kebab");
    const newKebab = {
      id: kebabs.length + 1,
      name: newKebabName.trim(),
      position: [clickPosition.lat, clickPosition.lng],
    };
    setKebabs([...kebabs, newKebab]);
    setClickPosition(null);
    setNewKebabName("");
  };

  const handleMarkerClick = (kebab) => {
    setSelectedKebab(kebab);
    const review = userReviews.find((r) => r.kebabId === kebab.id) || null;
    setEditingReview(review);
    setView("review");
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const form = e.target;
    const text = form.description.value.trim();
    const note = parseInt(form.note.value);
    if (!text || !note) return alert("Merci de remplir texte et note");

    let updatedReviews = editingReview
      ? userReviews.map((r) => (r.kebabId === selectedKebab.id ? { ...r, text, note } : r))
      : [...userReviews, { kebabId: selectedKebab.id, text, note }];

    setUserReviews(updatedReviews);
    setAccounts((accs) =>
      accs.map((acc) =>
        acc.id === auth.id ? { ...acc, reviews: updatedReviews } : acc
      )
    );
    setView("map");
    setSelectedKebab(null);
    setEditingReview(null);
    form.reset();
  };

  const sendFriendRequest = () => {
    const friendId = newFriendId.trim().toLowerCase();
    if (!friendId) return alert("Entrez un pseudo");
    if (friendId === auth.id.toLowerCase()) return alert("Vous ne pouvez pas vous ajouter vous-même");
    if (friends.some((f) => f.id.toLowerCase() === friendId)) return alert("Cet utilisateur est déjà votre ami");

    const friendAccount = accounts.find((acc) => acc.id.toLowerCase() === friendId);
    if (!friendAccount) return alert("Utilisateur non trouvé");

    const friendName = friendAccount.id;
    setFriends((old) => [...old, { id: friendId, name: friendName, reviews: friendAccount.reviews || [] }]);
    setAccounts((accs) =>
      accs.map((acc) =>
        acc.id === friendId
          ? { ...acc, friends: [...(acc.friends || []), { id: auth.id, name: auth.id }] }
          : acc
      )
    );
    alert(`${friendName} est maintenant votre ami !`);
    setNewFriendId("");
  };

  const handleLogout = () => {
    setAuth({ email: "", id: "", password: "", loggedIn: false });
    setUserReviews([]);
    setSelectedKebab(null);
    setView("login");
    setFriends([
      { id: "octave", name: "Octave", reviews: [{ kebabId: 1, note: 4, text: "Top !" }] },
      { id: "ilias", name: "Ilias", reviews: [{ kebabId: 2, note: 5, text: "Incroyable sauce blanche" }] },
    ]);
  };

  return (
    <div className="h-screen w-screen bg-orange-100 flex flex-col font-sans">
      <div className="text-center text-4xl font-bold p-4 text-orange-700">Keb'app</div>

      {auth.loggedIn && (
        <div className="flex justify-start gap-2 p-2 bg-orange-200">
          <Button
            onClick={() => setView("map")}
            className={`bg-white text-orange-700 ${view === "map" ? "font-bold" : ""}`}
          >
            Carte
          </Button>
          <Button
            onClick={() => setView("favorites")}
            className={`bg-white text-orange-700 ${view === "favorites" ? "font-bold" : ""}`}
          >
            Mes avis
          </Button>
          <Button
            onClick={() => setView("friends")}
            className={`bg-white text-orange-700 ${view === "friends" ? "font-bold" : ""}`}
          >
            Mes amis
          </Button>
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
          {mode === "login" ? (
            <>
              <Button onClick={handleLoginOrRegister}>Connexion</Button>
              <button className="mt-2 text-sm text-orange-700 underline" onClick={() => setMode("register")}>Un petit nouveau ?</button>
            </>
          ) : (
            <>
              <Button onClick={handleLoginOrRegister}>Créer mon compte</Button>
              <button className="mt-2 text-sm text-orange-700 underline" onClick={() => setMode("login")}>Déjà inscrit ?</button>
            </>
          )}
        </div>
      )}

      {auth.loggedIn && view === "map" && (
        <>
          <MapContainer center={position} zoom={13} style={{ height: "80vh", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {kebabs.map((kebab) => (
              <Marker key={kebab.id} position={kebab.position} eventHandlers={{ click: () => handleMarkerClick(kebab) }}>
                <Popup>
                  <div>
                    <strong>{kebab.name}</strong>
                    <br />
                    <Button className="mt-2 bg-orange-500 text-white" onClick={() => handleMarkerClick(kebab)}>Rédiger un avis</Button>
                    <div className="mt-2 text-sm max-h-32 overflow-auto">
                      {friends.flatMap((u) => u.reviews.filter((r) => r.kebabId === kebab.id).map((r) => `${u.name} : ${r.text} (${r.note}/5)`)).map((txt, i) => <div key={i}>{txt}</div>)}
                      {userReviews.filter((r) => r.kebabId === kebab.id).map((r, i) => <div key={`user-${i}`} className="font-semibold text-orange-700">Moi : {r.text} ({r.note}/5)</div>)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            <ClickableMap onClick={handleMapClick} />
          </MapContainer>

          {clickPosition && (
            <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", backgroundColor: "white", padding: 15, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.3)", zIndex: 1000, width: 300 }}>
              <h3>Ajouter un kebab ici ?</h3>
              <input placeholder="Nom du kebab" value={newKebabName} onChange={(e) => setNewKebabName(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 8 }} />
              <div>
                <Button onClick={addKebab}>Ajouter</Button>
                <Button onClick={() => setClickPosition(null)} className="bg-gray-400 ml-2">Annuler</Button>
              </div>
            </div>
          )}
        </>
      )}

      {auth.loggedIn && view === "review" && selectedKebab && (
        <form onSubmit={handleSubmitReview} className="flex-1 p-4 bg-orange-100 overflow-auto">
          <h2 className="text-2xl font-bold mb-2 text-orange-700">{selectedKebab.name}</h2>
          <textarea name="description" placeholder="Rédige ton avis ici..." className="w-full h-24 p-2 border rounded mb-2" defaultValue={editingReview ? editingReview.text : ""} required />
          <div className="flex items-center mb-2">
            <label htmlFor="note" className="mr-2">Note :</label>
            <select name="note" id="note" className="border rounded px-2 py-1" defaultValue={editingReview ? editingReview.note : 5} required>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Button type="submit" className="bg-orange-500 text-white">{editingReview ? "Modifier l'avis" : "Ajouter l'avis"}</Button>
          <Button type="button" onClick={() => { setView("map"); setSelectedKebab(null); setEditingReview(null); }} className="ml-2 bg-gray-400">Annuler</Button>
        </form>
      )}

      {auth.loggedIn && view === "favorites" && (
        <div className="flex-1 p-4 overflow-auto bg-orange-100">
          <h2 className="text-xl font-bold text-orange-700 mb-4">Mes chouchous</h2>
          {userReviews.length === 0 && <p>Tu n'as encore laissé aucun avis.</p>}
          {userReviews.map((r, i) => (
            <div key={i} className="mb-2 border-b pb-2">
              <strong>{kebabs.find((k) => k.id === r.kebabId)?.name}</strong>
              <div>{r.text} ({r.note}/5)</div>
            </div>
          ))}
        </div>
      )}

      {auth.loggedIn && view === "friends" && (
        <div className="flex-1 p-4 overflow-auto bg-orange-100">
          <h2 className="text-xl font-bold text-orange-700 mb-4 flex justify-between items-center">
            Mes kebabiers
            <div className="flex gap-2">
              <input placeholder="Pseudo ami" value={newFriendId} onChange={(e) => setNewFriendId(e.target.value)} className="border p-1 rounded" />
              <Button onClick={sendFriendRequest}>Ajouter</Button>
            </div>
          </h2>
          <ul>
            {friends.length === 0 && <p>Tu n'as pas encore d'amis.</p>}
            {friends.map((f) => (
              <li key={f.id} className="cursor-pointer hover:underline mb-2" onClick={() => alert(f.reviews.length > 0 ? f.reviews.map((r) => `${r.text} (${r.note}/5)`).join("\n") : `${f.name} n'a pas encore laissé d'avis.`)}>
                {f.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
