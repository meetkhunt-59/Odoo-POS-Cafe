import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { api } from "./api";

// Layout & Pages
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import POS from "./pages/POS";
import Kitchen from "./pages/Kitchen";
import Customer from "./pages/Customer";

export default function App() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authError, setAuthError] = useState("");
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([
    { id: "t1", label: "Table 1" },
    { id: "t2", label: "Table 2" },
  ]);
  const [activeTable, setActiveTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [session, setSession] = useState(null);

  const total = useMemo(() => cart.reduce((sum, line) => sum + line.price * line.qty, 0), [cart]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      if (accessToken) {
        setToken(accessToken);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    (async () => {
      try {
        const [me, prods, methods] = await Promise.all([
          api.me(token),
          api.listProducts(token).catch(() => []),
          api.listPaymentMethods(token).catch(() => []),
        ]);
        setProfile(me);
        setProducts(prods);
        setPaymentMethods(methods);
      } catch (err) {
        setAuthError(err.message);
      }
    })();
  }, [token]);

  const handleSignup = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await api.signup({
        email: form.get("email"),
        password: form.get("password"),
        name: form.get("name"),
      });
      alert("Admin created. Now login.");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const sess = await api.login(form.get("email"), form.get("password"));
      setToken(sess.access_token);
      setAuthError("");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) => (l.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), qty: 1 }];
    });
  };

  const bumpQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const openSession = async () => {
    try {
      const s = await api.openSession(token);
      setSession(s);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth token={token} handleSignup={handleSignup} handleLogin={handleLogin} authError={authError} />} />
        
        {/* Customer Route gets its own fullscreen Layout */}
        <Route path="/customer/:id?" element={<Customer />} />

        {/* Dashboard Pages */}
        <Route element={<Layout profile={profile} token={token} setToken={setToken} />}>
          <Route 
            path="/pos" 
            element={
              <POS
                tables={tables}
                activeTable={activeTable}
                setActiveTable={setActiveTable}
                session={session}
                openSession={openSession}
                products={products}
                addToCart={addToCart}
                cart={cart}
                bumpQty={bumpQty}
                total={total}
                paymentMethods={paymentMethods}
              />
            } 
          />
          <Route path="/kitchen" element={<Kitchen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
