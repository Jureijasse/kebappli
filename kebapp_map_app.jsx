import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

const kebabs = [
  { id: 1, name: "Kebab Royal", position: [48.8566, 2.3522], reviews: [] },
  { id: 2, name: "Chez Momo", position: [48.8606, 2.3376], reviews: [] },
  { id: 3, name: "Kebab Express", position: [48.853, 2.3499], reviews: [] },
];

const fakeUsers = [
  { id: 1, name: "Paul", reviews: [{ kebabId: 1, note: 4, text: "Top !" }] },
  { id: 2, name: "Leila", reviews: [{ kebabId: 2, note: 5, text: "Incroyable sauce blanche" }] },
];

export default function KebApp() {
  const [view, setView] = useState("map");
  const [selectedKebab, setSelectedKebab] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [auth, setAuth] = useState({ email: "", id: "", password: "", loggedIn: false });
  const [friends, setFriends] = useState(fakeUsers);
  const [userReviews, setUserReviews] = useState([]);

  const handleLogin = () => {
    setAuth((prev) => ({ ...prev, loggedIn: true }));
  };

  const handleMarkerClick = (kebab) => {
    setSelectedKebab(kebab);
    setView("review");
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const form = e.target;
    const newReview = {
      kebabId: selectedKebab.id,
      note: form.note.value,
      text: form.description.value,
    };
    setUserReviews([...userReviews, newReview]);
    setView("map");
    setSelectedKebab(null);
  };

  return (
    <div className="h-screen w-screen bg-orange-100 flex flex-col font-sans">
      <div className="text-center text-4xl font-bold p-4 text-orange-700">Keb'app</div>

      {!auth.loggedIn ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white p-4">
          <input placeholder="Identifiant" className="mb-2 border p-2 rounded" onChange={(e) => setAuth({ ...auth, id: e.target.value })} />
          <input placeholder="Email" className="mb-2 border p-2 rounded" onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
          <input placeholder="Mot de passe" type="password" className="mb-2 border p-2 rounded" onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
          <Button onClick={handleLogin} className="bg-orange-500 text-white">Connexion</Button>
        </div>
      ) : view === "map" ? (
        <MapContainer center={[48.8566, 2.3522]} zoom={13} className="flex-1 z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {kebabs.map((kebab) => (
            <Marker
              key={kebab.id}
              position={kebab.position}
              eventHandlers={{ click: () => handleMarkerClick(kebab) }}
            >
              <Popup>
                <strong>{kebab.name}</strong>
                <div className="text-sm mt-1">
                  {fakeUsers
                    .flatMap((u) => u.reviews.filter((r) => r.kebabId === kebab.id).map((r) => `${u.name} : ${r.text} (${r.note}/5)`))
                    .map((txt, i) => (
                      <div key={i}>{txt}</div>
                    ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : view === "review" && selectedKebab ? (
        <form onSubmit={handleSubmitReview} className="flex-1 p-4 bg-white">
          <h2 className="text-2xl font-bold mb-2 text-orange-700">{selectedKebab.name}</h2>
          <textarea name="description" placeholder="Rédige ton avis ici..." className="w-full h-24 p-2 border rounded mb-2" />
          <input type="file" className="mb-2" />
          <div className="flex items-center mb-2">
            <span className="mr-2">Note :</span>
            <select name="note" className="border rounded px-2 py-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="bg-orange-500 text-white">Valider</Button>
        </form>
      ) : view === "favorites" ? (
        <div className="flex-1 p-4 overflow-auto bg-white">
          <h2 className="text-xl font-bold text-orange-700 mb-4">Mes chouchous</h2>
          {userReviews.map((r, i) => (
            <div key={i} className="mb-2">
              <strong>{kebabs.find((k) => k.id === r.kebabId)?.name}</strong>
              <div>{r.text} ({r.note}/5)</div>
            </div>
          ))}
        </div>
      ) : view === "friends" ? (
        <div className="flex-1 p-4 overflow-auto bg-white">
          <h2 className="text-xl font-bold text-orange-700 mb-4">Mes kebabiers</h2>
          <ul>
            {friends.map((f) => (
              <li key={f.id} onClick={() => alert(f.reviews.map((r) => `${r.text} (${r.note}/5)`).join("\n"))}>
                {f.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {auth.loggedIn && (
        <div className="flex justify-start gap-2 p-2 bg-orange-200">
          <Button onClick={() => setView("favorites")} className="bg-white text-orange-700">
            Mes chouchous
          </Button>
          <Button onClick={() => setView("friends")} className="bg-white text-orange-700">
            Mes kebabiers
          </Button>
        </div>
      )}
    </div>
  );
}
