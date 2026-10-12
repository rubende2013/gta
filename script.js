const STORAGE_KEY = "los-santos-ledger-v1";
    const defaultBusinesses = [
      {id:"office",name:"CEO Office",category:"CEO",icon:"OFF",desc:"Your executive base for CEO work and special cargo."},
      {id:"warehouse-small",name:"Small Cargo Warehouse",category:"CEO",icon:"BOX",desc:"Store and source special cargo crates."},
      {id:"warehouse-medium",name:"Medium Cargo Warehouse",category:"CEO",icon:"BOX",desc:"A mid-sized special cargo operation."},
      {id:"warehouse-large",name:"Large Cargo Warehouse",category:"CEO",icon:"WH",desc:"High-capacity special cargo storage."},
      {id:"vehicle-warehouse",name:"Vehicle Cargo Warehouse",category:"CEO",icon:"CAR",desc:"Source, store, and export vehicle cargo."},
      {id:"bunker",name:"Bunker",category:"Gunrunning",icon:"BKR",desc:"Research, supplies, and weapons manufacturing."},
      {id:"hangar",name:"Hangar",category:"Smuggling",icon:"AIR",desc:"Aircraft storage and air freight cargo."},
      {id:"nightclub",name:"Nightclub",category:"Nightlife",icon:"CLB",desc:"Manage popularity, storage, and warehouse goods."},
      {id:"arcade",name:"Arcade",category:"Other",icon:"ARC",desc:"Plan the Diamond Casino Heist and manage arcade games."},
      {id:"agency",name:"Agency",category:"Other",icon:"AGY",desc:"VIP contracts, security contracts, and the armory."},
      {id:"auto-shop",name:"Auto Shop",category:"Other",icon:"AUTO",desc:"Customer cars, contracts, and vehicle modifications."},
      {id:"salvage-yard",name:"Salvage Yard",category:"Other",icon:"SALV",desc:"Vehicle robberies, salvage, and tow truck work."},
      {id:"bail-office",name:"Bail Enforcement Office",category:"Other",icon:"BAIL",desc:"Standard and most-wanted bounty targets."},
      {id:"mc-clubhouse",name:"MC Clubhouse",category:"Biker",icon:"MC",desc:"Your biker headquarters and club operations."},
      {id:"cocaine",name:"Cocaine Lockup",category:"Biker",icon:"COC",desc:"Motorcycle Club production business."},
      {id:"meth",name:"Methamphetamine Lab",category:"Biker",icon:"METH",desc:"Motorcycle Club production business."},
      {id:"cash",name:"Counterfeit Cash Factory",category:"Biker",icon:"CASH",desc:"Motorcycle Club production business."},
      {id:"weed",name:"Weed Farm",category:"Biker",icon:"WEED",desc:"Motorcycle Club production business."},
      {id:"documents",name:"Document Forgery Office",category:"Biker",icon:"DOC",desc:"Motorcycle Club production business."},
      {id:"facility",name:"Facility",category:"Other",icon:"FAC",desc:"Planning space for the Doomsday Heist."},
      {id:"arcade-master",name:"Master Control Terminal",category:"Other",icon:"MCT",desc:"Track your setup for managing linked businesses."},
      {id:"terrorbyte",name:"Terrorbyte",category:"Other",icon:"TRK",desc:"Mobile operations and client jobs."},
      {id:"kosatka",name:"Kosatka Submarine",category:"Other",icon:"SUB",desc:"Plan the Cayo Perico Heist."},
      {id:"freakshop",name:"Freakshop",category:"Other",icon:"SHOP",desc:"Your base for selected special vehicle operations."},
      {id:"eclipse",name:"Salvage / Other Property",category:"Other",icon:"PROP",desc:"Use this entry for another property or operation."}
    ];

    let state = loadState();
    let activeForm = null;
    let toastTimer;

    function loadState() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.businesses)) {
          const existing = new Map(saved.businesses.map(b => [b.id, b]));
          const merged = defaultBusinesses.map(b => ({...b, ...(existing.get(b.id) || {})}));
          saved.businesses.filter(b => !defaultBusinesses.some(d => d.id === b.id)).forEach(b => merged.push(b));
          return {businesses: merged, vehicles: Array.isArray(saved.vehicles) ? saved.vehicles : [], notes: saved.notes || "", money: Number(saved.money) || 0, moneyTransactions: Array.isArray(saved.moneyTransactions) ? saved.moneyTransactions : [], properties: Array.isArray(saved.properties) ? saved.properties : []};
        }
      } catch (e) {}
      return {businesses: defaultBusinesses.map(b => ({...b, owned:false, vehicles:[], upgrades:"", location:"", notes:""})), vehicles: [], notes:"", money: 0, moneyTransactions: [], properties: []};
    }
    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderStats();
    }
    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    }
    function showToast(message) {
      const el = document.getElementById("toast");
      el.textContent = message;
      el.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
    }
    function renderStats() {
      const owned = state.businesses.filter(b => b.owned).length;
      const upgrades = state.businesses.filter(b => b.owned && b.upgrades && b.upgrades.trim()).length;
      document.getElementById("ownedStat").innerHTML = `${owned} <span style="color:var(--color-mist);font-size:17px">/ ${state.businesses.length}</span>`;
      document.getElementById("vehicleStat").textContent = state.vehicles.length;
      document.getElementById("upgradeStat").textContent = upgrades;
      const pct = state.businesses.length ? Math.round(owned / state.businesses.length * 100) : 0;
      document.getElementById("completionStat").textContent = pct + "%";
      document.getElementById("completionBar").style.width = pct + "%";
    }
    function renderBusinesses() {
      const grid = document.getElementById("businessGrid");
      const query = document.getElementById("search").value.trim().toLowerCase();
      const filter = document.getElementById("filter").value;
      const category = document.getElementById("categoryFilter").value;
      const list = state.businesses.filter(b => {
        const matchesQuery = [b.name,b.category,b.desc,b.location].some(v => String(v || "").toLowerCase().includes(query));
        const matchesFilter = filter === "all" || (filter === "owned" ? b.owned : !b.owned);
        return matchesQuery && matchesFilter && (category === "all" || b.category === category);
      });
      if (!list.length) {
        grid.innerHTML = '<div class="empty"><strong>No businesses found</strong>Try another search or change your filters.</div>';
        return;
      }
      grid.innerHTML = list.map(b => `
        <article class="business-card ${b.owned ? "owned" : ""}">
          <div class="card-main">
            <div class="card-top">
              <div class="business-icon">${escapeHTML(b.icon || "BUS")}</div>
              <div class="card-title-wrap">
                <div class="card-title">${escapeHTML(b.name)}</div>
                <div class="card-category">${escapeHTML(b.category)}${b.location ? " · " + escapeHTML(b.location) : ""}</div>
              </div>
              <span class="pill ${b.owned ? "owned" : ""}">${b.owned ? "✓ OWNED" : "NOT OWNED"}</span>
            </div>
            <div class="card-desc">${escapeHTML(b.notes || b.desc || "Add your personal notes for this business.")}</div>
            <div class="card-bottom">
              <small>${(b.vehicles || []).length} linked vehicle${(b.vehicles || []).length === 1 ? "" : "s"}${b.upgrades ? " · Upgrades added" : ""}</small>
              <button class="button ${b.owned ? "" : "primary"}" data-edit-business="${escapeHTML(b.id)}" type="button">${b.owned ? "Edit details" : "＋ Add business"}</button>
            </div>
          </div>
        </article>`).join("");
    }
    function renderGarage() {
      const panel = document.getElementById("garagePanel");
      if (!state.vehicles.length) {
        panel.innerHTML = '<div class="garage-empty"><div class="big-icon">GARAGE</div><strong style="color:var(--color-ink)">Your garage is empty</strong><div>Add the vehicles you own to start building your collection.</div><button class="button primary" style="margin-top:14px" id="emptyAddVehicle" type="button">＋ Add your first vehicle</button></div>';
        return;
      }
      panel.innerHTML = '<div class="garage-list">' + state.vehicles.map(v => `
        <div class="vehicle-row">
          <div class="vehicle-emoji">${escapeHTML(v.icon || "CAR")}</div>
          <div class="vehicle-info"><strong>${escapeHTML(v.name)}</strong><small>${escapeHTML(v.type || "Vehicle")}${v.garage ? " · " + escapeHTML(v.garage) : ""}${v.business ? " · " + escapeHTML(v.business) : ""}</small>${v.notes ? `<small style="display:block;margin-top:3px">${escapeHTML(v.notes)}</small>` : ""}</div>
          <button class="button" type="button" data-edit-vehicle="${escapeHTML(v.id)}">Edit</button>
          <button class="button danger" type="button" data-delete-vehicle="${escapeHTML(v.id)}" aria-label="Delete ${escapeHTML(v.name)}">×</button>
        </div>`).join("") + "</div>";
    }
    function renderProperties() {
      const list = document.getElementById("propertiesList");
      if (!list) return;
      const properties = Array.isArray(state.properties) ? state.properties : [];
      document.getElementById("propertyCount").textContent = properties.length;
      document.getElementById("mansionCount").textContent = properties.filter(p => p.type === "Mansion").length;
      if (!properties.length) {
        list.innerHTML = '<p style="color:var(--color-ash)">No properties added yet. Select “Add property” to get started.</p>';
        return;
      }
      list.innerHTML = '<div class="garage-list">' + properties.map((p, i) => `
        <div class="vehicle-row">
          <div class="vehicle-info"><strong>${escapeHTML(p.name || p.type || "Property")}</strong><small>${escapeHTML(p.type || "Property")}${p.location ? " · " + escapeHTML(p.location) : ""}${p.price ? " · GTA$ " + Number(p.price).toLocaleString("en-US") : ""}${p.notes ? "<br>" + escapeHTML(p.notes) : ""}</small></div>
          <button class="button danger" type="button" data-remove-property="${i}" aria-label="Remove property">Remove</button>
        </div>`).join("") + '</div>';
      list.querySelectorAll("[data-remove-property]").forEach(btn => btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-remove-property"));
        if (!Number.isInteger(i) || !state.properties[i]) return;
        if (!window.confirm("Remove this property from your tracker?")) return;
        state.properties.splice(i, 1);
        saveState();
        renderProperties();
      }));
    }
    function addProperty() {
      openModal("Add property", "Add any property you own. You can add multiple mansions or properties of the same type.", `
        <label class="field"><span>Property type</span><select name="type" required>
          <option value="Mansion">Mansion</option><option value="Apartment">Apartment</option><option value="House">House</option><option value="Garage">Garage</option><option value="Penthouse">Penthouse</option><option value="Other">Other</option>
        </select></label>
        <label class="field"><span>Property name</span><input name="name" required maxlength="100" placeholder="e.g. Tongva Hills Mansion"></label>
        <label class="field"><span>Location (optional)</span><input name="location" maxlength="100" placeholder="e.g. Tongva Hills"></label>
        <label class="field"><span>Purchase price (GTA$, optional)</span><input name="price" type="number" min="0" step="1" placeholder="e.g. 12000000"></label>
        <label class="field"><span>Notes (optional)</span><textarea name="notes" rows="2" maxlength="300" placeholder="Upgrades, garage capacity, etc."></textarea></label>
      `, data => {
        const name = String(data.name || "").trim();
        const type = String(data.type || "Other");
        if (!name) { showToast("Enter a property name."); return false; }
        state.properties = [...(state.properties || []), {id: Date.now() + Math.random(), type, name, location: String(data.location || "").trim(), price: Math.max(0, Number(data.price) || 0), notes: String(data.notes || "").trim()}];
        saveState();
        renderProperties();
        showToast("Property added.");
        return true;
      });
    }
    function formatGTA(value) {
      return "GTA$ " + Math.round(Number(value) || 0).toLocaleString("en-US");
    }
    function renderMoney() {
      const balance = Number(state.money) || 0;
      document.getElementById("moneyBalance").textContent = formatGTA(balance);
      const transactions = Array.isArray(state.moneyTransactions) ? state.moneyTransactions : [];
      const container = document.getElementById("moneyTransactions");
      if (!transactions.length) {
        container.innerHTML = '<p style="color:var(--color-ash)">No transactions yet.</p>';
        return;
      }
      container.innerHTML = '<div class="garage-list">' + transactions.slice(0, 8).map(t => `
        <div class="vehicle-row">
          <div class="vehicle-info"><strong>${escapeHTML(t.label || (t.amount >= 0 ? "Money added" : "Money removed"))}</strong><small>${escapeHTML(t.date || "")}</small></div>
          <strong style="margin-left:auto;color:${t.amount >= 0 ? 'var(--color-ink)' : 'var(--color-orange)'}">${t.amount >= 0 ? "+" : "−"}${formatGTA(Math.abs(t.amount))}</strong>
        </div>`).join("") + '</div>';
    }
    function changeMoney(direction) {
      const action = direction > 0 ? "Add money" : "Remove money";
      openModal(action, "Update your manually tracked GTA$ balance.", `
        <label class="field"><span>Amount (GTA$)</span><input name="amount" type="number" min="1" step="1" required placeholder="e.g. 250000"></label>
        <label class="field"><span>Note (optional)</span><input name="label" type="text" maxlength="80" placeholder="e.g. Cayo Perico payout"></label>
      `, data => {
        const amount = Math.floor(Number(data.amount));
        if (!Number.isFinite(amount) || amount <= 0) { showToast("Enter an amount greater than zero."); return false; }
        const delta = amount * direction;
        if (direction < 0 && amount > (Number(state.money) || 0)) {
          showToast("You cannot remove more money than your tracked balance.");
          return false;
        }
        state.money = Math.max(0, (Number(state.money) || 0) + delta);
        state.moneyTransactions = [{amount: delta, label: data.label || action, date: new Date().toLocaleDateString()}, ...(state.moneyTransactions || [])].slice(0, 30);
        saveState();
        renderMoney();
        showToast(direction > 0 ? "Money added." : "Money removed.");
        return true;
      });
      document.getElementById("detailForm").onsubmit = e => {
        e.preventDefault();
        if (!activeForm) return;
        const fd = new FormData(e.currentTarget);
        const data = {};
        for (const [key, value] of fd.entries()) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
          } else {
            data[key] = value;
          }
        }
        // Convert checkbox values and trim text fields while preserving numeric input strings.
        e.currentTarget.querySelectorAll('input[type="checkbox"][name]').forEach(input => {
          if (input.checked && !Object.prototype.hasOwnProperty.call(data, input.name)) data[input.name] = input.value || "on";
          if (!input.checked) data[input.name] = "";
        });
        const result = activeForm.onSave(data);
        if (result !== false) closeModal();
      };
      document.getElementById("cancelModal").onclick = closeModal;
    }
    function renderAll() {
      renderStats(); renderBusinesses(); renderGarage(); renderMoney(); renderProperties();
      document.getElementById("empireNotes").value = state.notes || "";
    }
    function openModal(title, subtitle, fields, onSave, deleteAction = null) {
      activeForm = {onSave, deleteAction};
      document.getElementById("modalTitle").textContent = title;
      document.getElementById("modalSubtitle").textContent = subtitle;
      document.getElementById("modalFields").innerHTML = fields;
      document.getElementById("modalBackdrop").classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(() => document.querySelector("#modalFields input:not([type=checkbox]), #modalFields textarea, #modalFields select")?.focus(), 50);
    }
    function closeModal() {
      document.getElementById("modalBackdrop").classList.remove("open");
      document.body.style.overflow = "";
      activeForm = null;
    }
    function businessFields(b = {}) {
      const categories = ["CEO","Biker","Gunrunning","Smuggling","Nightlife","Other"];
      // GTA Online property locations are specific to each business.
      const locationSets = {
        office: ["Maze Bank Tower","Arcadius Business Center","Lombank West","Maze Bank West"],
        "warehouse-small": ["Convenience Store Lockup","Celltowa Unit","White Widow Garage","Pacific Bait Storage","Pier 400 Utility Building","Foreclosed Garage","GEE Warehouse","Derriere Lingerie Backlot","Fridgit Annexe","Discount Retail Unit","Old Power Station","Other / custom"],
        "warehouse-medium": ["Garnet Street","Wholesale Furniture","Pacific Bait Storage","Railyard Warehouse","Old Ventilation Works","Cypress Warehouses","Other / custom"],
        "warehouse-large": ["Darnell Bros Warehouse","Wholesale Furniture","Logistics Depot","Walker & Sons Warehouse","Cypress Warehouses","West Vinewood Backlot","Xero Gas Factory","Other / custom"],
        "vehicle-warehouse": ["La Puerta Vehicle Warehouse","El Burro Heights Vehicle Warehouse","Elysian Island Vehicle Warehouse","LSIA Vehicle Warehouse","Davis Vehicle Warehouse","Cypress Flats Vehicle Warehouse","Murrieta Heights Vehicle Warehouse","Other / custom"],
        bunker: ["Paleto Forest Bunker","Raton Canyon Bunker","Lago Zancudo Bunker","Chumash Bunker","Route 68 Bunker","Grand Senora Oilfields Bunker","Grand Senora Desert Bunker","Smoke Tree Road Bunker","Thomson Scrapyard Bunker","Farmhouse Bunker"],
        hangar: ["LSIA Hangar A17","LSIA Hangar 1","Fort Zancudo Hangar 3497","Fort Zancudo Hangar 3499","Fort Zancudo Hangar A2"],
        nightclub: ["Del Perro Nightclub","Vespucci Canals Nightclub","LSIA Nightclub","Mission Row Nightclub","La Mesa Nightclub","Strawberry Nightclub","West Vinewood Nightclub","Downtown Vinewood Nightclub","Cypress Flats Nightclub","Elysian Island Nightclub"],
        arcade: ["Pixel Pete's (Paleto Bay)","Wonderama (Grapeseed)","Videogeddon (La Mesa)","Insert Coin (Rockford Hills)","Eight-Bit (Vinewood)","Other / custom"],
        agency: ["Little Seoul Agency","Vespucci Canals Agency","Rockford Hills Agency","Hawick Agency"],
        "auto-shop": ["Mission Row Auto Shop","Strawberry Auto Shop","Rancho Auto Shop","Burton Auto Shop","La Mesa Auto Shop"],
        "salvage-yard": ["Paleto Bay Salvage Yard","Sandy Shores Salvage Yard","La Puerta Salvage Yard","Strawberry Salvage Yard","Murrieta Heights Salvage Yard"],
        "bail-office": ["Mission Row Bail Office","Paleto Bay Bail Office","Davis Bail Office","Del Perro Bail Office","La Mesa Bail Office"],
        "mc-clubhouse": ["Great Chaparral Clubhouse","Sandy Shores Clubhouse","Paleto Bay Clubhouse","Grapeseed Clubhouse","Del Perro Beach Clubhouse","Downtown Vinewood Clubhouse","Pillbox Hill Clubhouse","Rancho Clubhouse","La Mesa Clubhouse","Other / custom"],
        cocaine: ["Alamo Sea Cocaine Lockup","Paleto Bay Cocaine Lockup","Elysian Island Cocaine Lockup","Morningwood Cocaine Lockup"],
        meth: ["Grand Senora Desert Meth Lab","Paleto Bay Meth Lab","El Burro Heights Meth Lab","Terminal Meth Lab"],
        cash: ["Grand Senora Desert Counterfeit Cash","Paleto Bay Counterfeit Cash","Cypress Flats Counterfeit Cash","Vespucci Canals Counterfeit Cash"],
        weed: ["San Chianski Mountain Range Weed Farm","Mount Chiliad Weed Farm","Elysian Island Weed Farm","Downtown Vinewood Weed Farm"],
        documents: ["Grapeseed Document Forgery","Paleto Bay Document Forgery","Elysian Island Document Forgery","Textile City Document Forgery"],
        facility: ["Paleto Bay Facility","Mount Gordo Facility","Sandy Shores Facility","Grand Senora Desert Facility","Route 68 Facility","Ron Alternates Wind Farm Facility","Zancudo River Facility","Lago Zancudo Facility"],
        terrorbyte: ["Stored in Nightclub Garage"],
        kosatka: ["Purchased through Warstock (stored offshore)"],
        freakshop: ["Mirror Park / Freakshop"],
        eclipse: ["Other / custom"]
      };
      const locations = locationSets[b.id] || ["Other / custom"];
      // Upgrade choices vary by property in GTA Online; avoid showing MC production upgrades on unrelated properties.
      const upgradeSets = {
        bunker: ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade"],
        cocaine: ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade"],
        meth: ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade"],
        cash: ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade"],
        weed: ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade"],
        documents: ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade"],
        nightclub: ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade", "Additional Storage Floors", "Technicians Assigned"],
        hangar: ["Aircraft Workshop", "Living Quarters"],
        agency: ["Armory", "Accommodation", "Vehicle Workshop"],
        "auto-shop": ["Personal Quarters", "Car Lift", "Staff", "Extra Lift"],
        arcade: ["Master Control Terminal", "Drone Station", "Personal Quarters", "Garage"],
        facility: ["Orbital Cannon", "Security Room", "Lounge", "Sleeping Quarters", "Vehicle Workshop"],
        terrorbyte: ["Specialized Workshop", "Drone Station", "Weapon Workshop"],
        kosatka: ["Sparrow", "Guided Missiles", "Sonar Station", "Weapon Workshop"],
        "mc-clubhouse": ["Custom Bike Shop", "Clubhouse Bar", "Gun Locker"],
        office: ["Accommodation", "Gun Locker", "Safe", "Office Garage"],
        "warehouse-small": ["Warehouse Staff"],
        "warehouse-medium": ["Warehouse Staff"],
        "warehouse-large": ["Warehouse Staff"],
        "vehicle-warehouse": ["Vehicle Warehouse Workshop"]
      };
      const upgradeOptions = upgradeSets[b.id] || (b.custom ? ["Equipment Upgrade", "Staff Upgrade", "Security Upgrade", "Storage Upgrade", "Workshop", "Other / custom"] : ["Other / custom"]);
      const locationOptions = [...locations];
      if (b.location && !locationOptions.includes(b.location)) locationOptions.unshift(b.location);
      const selectedUpgrades = String(b.upgrades || "").split(",").map(x => x.trim()).filter(Boolean);
      return `
        <div class="form-grid">
          <div class="field full"><label for="fName">Business name</label><input id="fName" name="name" required maxlength="80" value="${escapeHTML(b.name || "")}" placeholder="e.g. Paleto Bay Bunker"></div>
          <div class="field"><label for="fCategory">Category</label><select id="fCategory" name="category">${categories.map(c => `<option ${b.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label for="fIcon">Icon / emoji</label><input id="fIcon" name="icon" maxlength="8" value="${escapeHTML(b.icon || "BUS")}" placeholder="🏢"></div>
          <div class="field full"><label class="check-field"><input type="checkbox" name="owned" ${b.owned ? "checked" : ""}> I own this business</label></div>
          <div class="field"><label for="fLocation">Business location</label><select id="fLocation" name="location"><option value="">Select location...</option>${locationOptions.map(location => `<option value="${escapeHTML(location)}" ${b.location === location ? "selected" : ""}>${escapeHTML(location)}</option>`).join("")}</select></div>
          <div class="field full"><label>Business upgrades</label><div class="upgrade-options">${upgradeOptions.map((upgrade, i) => `<label class="check-field"><input type="checkbox" name="upgrades" value="${escapeHTML(upgrade)}" ${selectedUpgrades.includes(upgrade) ? "checked" : ""}> ${escapeHTML(upgrade)}</label>`).join("")}</div><small style="color:var(--color-ash)">Select every upgrade you have installed. Options depend on the selected business.</small></div>
          <div class="field full"><label for="fVehicles">Vehicles linked to this business</label><input id="fVehicles" name="vehicles" value="${escapeHTML((b.vehicles || []).join(", "))}" maxlength="300" placeholder="Terrorbyte, delivery van..."><small style="color:var(--color-ash)">Separate vehicle names with commas.</small></div>
          <div class="field full"><label for="fNotes">Personal notes</label><textarea id="fNotes" name="notes" maxlength="1500" placeholder="Anything you want to remember...">${escapeHTML(b.notes || "")}</textarea></div>
        </div>
        <div class="modal-actions">
          ${b.custom ? '<button class="button danger" type="button" id="deleteBusinessBtn">Delete business</button>' : '<span></span>'}
          <div class="modal-actions-right"><button class="button" type="button" id="cancelModal">Cancel</button><button class="button primary" type="submit">Save details</button></div>
        </div>`;
    }
    function editBusiness(id) {
      const business = state.businesses.find(b => b.id === id);
      if (!business) return;
      openModal(business.owned ? "Edit business" : "Add a business", business.name, businessFields(business), data => {
        Object.assign(business, data);
        saveState(); renderBusinesses(); renderGarage(); showToast("Business details saved.");
      }, business.custom ? () => {
        state.businesses = state.businesses.filter(b => b.id !== id);
        saveState(); renderAll(); showToast("Business deleted.");
      } : null);
      document.getElementById("detailForm").onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        activeForm.onSave({
          name: String(fd.get("name")).trim(),
          category: String(fd.get("category")),
          icon: String(fd.get("icon") || "🏢").trim(),
          owned: fd.get("owned") === "on",
          location: String(fd.get("location") || "").trim(),
          upgrades: fd.getAll("upgrades").map(value => String(value).trim()).filter(Boolean).join(", "),
          vehicles: String(fd.get("vehicles") || "").split(",").map(s => s.trim()).filter(Boolean),
          notes: String(fd.get("notes") || "").trim()
        });
        closeModal();
      };
      document.getElementById("cancelModal").onclick = closeModal;
      const del = document.getElementById("deleteBusinessBtn");
      if (del) del.onclick = () => { if (confirm("Delete this custom business?")) { activeForm.deleteAction?.(); closeModal(); } };
    }
    function vehicleFields(v = {}) {
      return `
        <div class="form-grid">
          <div class="field full"><label for="vName">Vehicle name</label><input id="vName" name="name" required maxlength="100" value="${escapeHTML(v.name || "")}" placeholder="e.g. Oppressor Mk II"></div>
          <div class="field"><label for="vType">Vehicle type</label><select id="vType" name="type">${["Super","Sports","Motorcycle","Weaponized","Aircraft","Helicopter","Boat","Off-road","Utility","Other"].map(t => `<option ${v.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div class="field"><label for="vIcon">Icon / emoji</label><input id="vIcon" name="icon" maxlength="8" value="${escapeHTML(v.icon || "CAR")}" placeholder="🚘"></div>
          <div class="field"><label for="vGarage">Garage / storage</label><input id="vGarage" name="garage" maxlength="100" value="${escapeHTML(v.garage || "")}" placeholder="e.g. Agency garage"></div>
          <div class="field"><label for="vBusiness">Linked business</label><select id="vBusiness" name="business"><option value="">None</option>${state.businesses.filter(b => b.owned).map(b => `<option value="${escapeHTML(b.name)}" ${v.business === b.name ? "selected" : ""}>${escapeHTML(b.name)}</option>`).join("")}</select></div>
          <div class="field full"><label for="vNotes">Notes / modifications</label><textarea id="vNotes" name="notes" maxlength="1000" placeholder="Armor, weapons, paint, upgrades...">${escapeHTML(v.notes || "")}</textarea></div>
        </div>
        <div class="modal-actions">
          ${v.id ? '<button class="button danger" type="button" id="deleteVehicleFromModal">Delete vehicle</button>' : '<span></span>'}
          <div class="modal-actions-right"><button class="button" type="button" id="cancelModal">Cancel</button><button class="button primary" type="submit">Save vehicle</button></div>
        </div>`;
    }
    function editVehicle(id = null) {
      const existing = id ? state.vehicles.find(v => v.id === id) : null;
      const v = existing || {};
      openModal(existing ? "Edit vehicle" : "Add a vehicle", "Keep your personal vehicle collection up to date.", vehicleFields(v), data => {
        if (existing) Object.assign(existing, data);
        else state.vehicles.push({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...data});
        saveState(); renderGarage(); renderBusinesses(); showToast(existing ? "Vehicle updated." : "Vehicle added.");
      });
      document.getElementById("detailForm").onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        activeForm.onSave({
          name: String(fd.get("name")).trim(),
          type: String(fd.get("type")),
          icon: String(fd.get("icon") || "🚘").trim(),
          garage: String(fd.get("garage") || "").trim(),
          business: String(fd.get("business") || ""),
          notes: String(fd.get("notes") || "").trim()
        });
        closeModal();
      };
      document.getElementById("cancelModal").onclick = closeModal;
      const del = document.getElementById("deleteVehicleFromModal");
      if (del) del.onclick = () => { if (confirm("Delete this vehicle?")) { state.vehicles = state.vehicles.filter(x => x.id !== id); saveState(); renderGarage(); renderBusinesses(); closeModal(); showToast("Vehicle deleted."); } };
    }

    // Use delegated click handling so business buttons keep working after every re-render.
    document.addEventListener("click", e => {
      const btn = e.target instanceof Element ? e.target.closest("[data-edit-business]") : null;
      if (btn) {
        e.preventDefault();
        editBusiness(btn.dataset.editBusiness);
      }
    });
    document.getElementById("garagePanel").addEventListener("click", e => {
      if (e.target.closest("#emptyAddVehicle")) editVehicle();
      const edit = e.target.closest("[data-edit-vehicle]");
      if (edit) editVehicle(edit.dataset.editVehicle);
      const del = e.target.closest("[data-delete-vehicle]");
      if (del && confirm("Delete this vehicle?")) {
        state.vehicles = state.vehicles.filter(v => v.id !== del.dataset.deleteVehicle);
        saveState(); renderGarage(); renderBusinesses(); showToast("Vehicle deleted.");
      }
    });
    document.getElementById("search").addEventListener("input", renderBusinesses);
    document.getElementById("filter").addEventListener("change", renderBusinesses);
    document.getElementById("categoryFilter").addEventListener("change", renderBusinesses);
    document.getElementById("addVehicleBtn").addEventListener("click", () => editVehicle());
    document.getElementById("addVehicleHero").addEventListener("click", () => editVehicle());
    document.getElementById("jumpBusinesses").addEventListener("click", () => document.getElementById("businesses").scrollIntoView({behavior:"smooth"}));
    document.getElementById("addPropertyBtn").addEventListener("click", addProperty);
    document.getElementById("addMoneyBtn").addEventListener("click", () => changeMoney(1));
    document.getElementById("removeMoneyBtn").addEventListener("click", () => changeMoney(-1));
    document.getElementById("clearTransactionsBtn").addEventListener("click", () => {
      if (!Array.isArray(state.moneyTransactions) || state.moneyTransactions.length === 0) {
        showToast("There are no transactions to clear.");
        return;
      }
      if (!window.confirm("Clear all transaction history? Your current money balance will stay the same.")) return;
      state.moneyTransactions = [];
      saveState();
      renderMoney();
      showToast("Transaction history cleared.");
    });

    document.getElementById("addBusinessBtn").addEventListener("click", e => {
      e.preventDefault();
      const id = "custom-" + (window.crypto && typeof window.crypto.randomUUID === "function" ? window.crypto.randomUUID() : Date.now().toString());
      const business = {id, name:"", category:"Other", icon:"OFF", desc:"Custom business", owned:false, vehicles:[], upgrades:"", location:"", notes:"", custom:true};
      state.businesses.push(business);
      saveState();
      renderBusinesses();
      editBusiness(id);
    });
    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("modalBackdrop").addEventListener("click", e => { if (e.target.id === "modalBackdrop") closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
    document.getElementById("empireNotes").addEventListener("input", e => {
      state.notes = e.target.value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    });
    document.getElementById("clearNotes").addEventListener("click", () => {
      if (confirm("Clear all empire notes?")) { state.notes = ""; document.getElementById("empireNotes").value = ""; saveState(); showToast("Notes cleared."); }
    });
    document.getElementById("exportBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "los-santos-ledger-backup.json"; a.click();
      URL.revokeObjectURL(url);
      showToast("Backup exported.");
    });

    // Keep unexpected JavaScript errors visible while testing in Codespaces.
    window.addEventListener("error", e => {
      console.error("Los Santos Ledger error:", e.message, e.filename, e.lineno);
      showToast("Something went wrong. Open the browser console for details.");
    });

    // Fix focus and form behavior consistently when a modal opens.
    document.getElementById("modalBackdrop").addEventListener("submit", e => e.preventDefault());
    renderAll();
