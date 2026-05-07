const LOCAL_DB_NAME = "LucidDreamsLocalDB";
const LOCAL_DB_VERSION = 1;

function openLocalDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("dreams")) {
        const dreamsStore = db.createObjectStore("dreams", {
          keyPath: "local_id"
        });

        dreamsStore.createIndex("sync_status", "sync_status", { unique: false });
        dreamsStore.createIndex("dream_date", "dream_date", { unique: false });
        dreamsStore.createIndex("created_at", "created_at", { unique: false });
      }
    };
  });
}

function createLocalId() {
  return `local-${Date.now()}-${crypto.randomUUID()}`;
}

async function saveLocalDream(dreamData) {
  const db = await openLocalDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dreams", "readwrite");
    const store = transaction.objectStore("dreams");

    const localDream = {
      local_id: dreamData.local_id || createLocalId(),
      supabase_id: dreamData.supabase_id || null,

      title: dreamData.title || "",
      dream_date: dreamData.dream_date || "",
      dream_type: dreamData.dream_type || "Normaler Traum",
      mood: dreamData.mood || "Neutral",
      sleep_quality: dreamData.sleep_quality || "Gut",
      description: dreamData.description || "",
      notes: dreamData.notes || "",
      is_lucid: dreamData.is_lucid || false,
      tags: dreamData.tags || [],

      sync_status: dreamData.sync_status || "pending",
      created_offline: dreamData.created_offline ?? !navigator.onLine,
      created_at: dreamData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const request = store.put(localDream);

    request.onsuccess = () => {
      resolve(localDream);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function getLocalDreams() {
  const db = await openLocalDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dreams", "readonly");
    const store = transaction.objectStore("dreams");

    const request = store.getAll();

    request.onsuccess = () => {
      const dreams = request.result || [];

      dreams.sort((a, b) => {
        return new Date(b.dream_date || b.created_at) - new Date(a.dream_date || a.created_at);
      });

      resolve(dreams);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function getPendingLocalDreams() {
  const db = await openLocalDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dreams", "readonly");
    const store = transaction.objectStore("dreams");
    const index = store.index("sync_status");

    const request = index.getAll("pending");

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function markLocalDreamAsSynced(localId, supabaseId) {
  const db = await openLocalDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dreams", "readwrite");
    const store = transaction.objectStore("dreams");

    const getRequest = store.get(localId);

    getRequest.onsuccess = () => {
      const dream = getRequest.result;

      if (!dream) {
        resolve(null);
        return;
      }

      dream.supabase_id = supabaseId;
      dream.sync_status = "synced";
      dream.updated_at = new Date().toISOString();

      const putRequest = store.put(dream);

      putRequest.onsuccess = () => {
        resolve(dream);
      };

      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

async function deleteLocalDream(localId) {
  const db = await openLocalDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dreams", "readwrite");
    const store = transaction.objectStore("dreams");

    const request = store.delete(localId);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

window.LucidLocalDB = {
  saveLocalDream,
  getLocalDreams,
  getPendingLocalDreams,
  markLocalDreamAsSynced,
  deleteLocalDream
};