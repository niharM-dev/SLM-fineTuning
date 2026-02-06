const state = {
  data: null,
};

const resultsEl = document.getElementById("results");
const queryInput = document.getElementById("query");
const searchBtn = document.getElementById("searchBtn");

const normalize = (value) => value.toLowerCase().trim();

const getMatches = (items, query) => {
  const normalizedQuery = normalize(query);
  return items.filter((item) => {
    const values = [item.name, item.id, ...(item.aliases || [])].map((entry) => normalize(entry));
    return values.some((value) => value.includes(normalizedQuery));
  });
};

const mapById = (items) => Object.fromEntries(items.map((item) => [item.id, item]));

const buildMappingIndex = (data) => {
  const frameworkById = mapById(data.frameworks);
  const policyById = mapById(data.policies);
  const controlById = mapById(data.controls);

  const policiesByFramework = {};
  const frameworksByPolicy = {};
  const controlsByPolicy = {};
  const policiesByControl = {};
  const controlsByFramework = {};
  const frameworksByControl = {};

  data.mappings.framework_policy_map.forEach(({ framework_id, policy_id }) => {
    policiesByFramework[framework_id] = policiesByFramework[framework_id] || new Set();
    policiesByFramework[framework_id].add(policy_id);

    frameworksByPolicy[policy_id] = frameworksByPolicy[policy_id] || new Set();
    frameworksByPolicy[policy_id].add(framework_id);
  });

  data.mappings.policy_control_map.forEach(({ policy_id, control_id }) => {
    controlsByPolicy[policy_id] = controlsByPolicy[policy_id] || new Set();
    controlsByPolicy[policy_id].add(control_id);

    policiesByControl[control_id] = policiesByControl[control_id] || new Set();
    policiesByControl[control_id].add(policy_id);
  });

  data.mappings.framework_control_map.forEach(({ framework_id, control_id }) => {
    controlsByFramework[framework_id] = controlsByFramework[framework_id] || new Set();
    controlsByFramework[framework_id].add(control_id);

    frameworksByControl[control_id] = frameworksByControl[control_id] || new Set();
    frameworksByControl[control_id].add(framework_id);
  });

  return {
    frameworkById,
    policyById,
    controlById,
    policiesByFramework,
    frameworksByPolicy,
    controlsByPolicy,
    policiesByControl,
    controlsByFramework,
    frameworksByControl,
  };
};

const listFromSet = (set) => (set ? Array.from(set) : []);

const renderCard = (title, items, typeClass) => {
  if (!items.length) {
    return "<p class=\"empty\">No related items found.</p>";
  }

  return `
    <div class="card-grid ${typeClass}">
      ${items
        .map(
          (item) => `
        <article class="card">
          <h3>${item.name}</h3>
          <p class="meta">ID: ${item.id}</p>
          <p>${item.description}</p>
        </article>
      `
        )
        .join("")}
    </div>
  `;
};

const renderResult = (item, type, index) => {
  const mappings = buildMappingIndex(state.data);
  let relatedPolicies = [];
  let relatedFrameworks = [];
  let relatedControls = [];

  if (type === "framework") {
    relatedPolicies = listFromSet(mappings.policiesByFramework[item.id]).map(
      (policyId) => mappings.policyById[policyId]
    );
    relatedControls = listFromSet(mappings.controlsByFramework[item.id]).map(
      (controlId) => mappings.controlById[controlId]
    );
  }

  if (type === "policy") {
    relatedFrameworks = listFromSet(mappings.frameworksByPolicy[item.id]).map(
      (frameworkId) => mappings.frameworkById[frameworkId]
    );
    relatedControls = listFromSet(mappings.controlsByPolicy[item.id]).map(
      (controlId) => mappings.controlById[controlId]
    );
  }

  if (type === "control") {
    relatedPolicies = listFromSet(mappings.policiesByControl[item.id]).map(
      (policyId) => mappings.policyById[policyId]
    );
    relatedFrameworks = listFromSet(mappings.frameworksByControl[item.id]).map(
      (frameworkId) => mappings.frameworkById[frameworkId]
    );
  }

  return `
    <section class="result">
      <header>
        <p class="pill">Match ${index + 1}: ${type}</p>
        <h2>${item.name}</h2>
        <p class="meta">${item.id}</p>
      </header>
      <p class="description">${item.description}</p>

      <div class="related">
        <h3>Related Frameworks</h3>
        ${renderCard("frameworks", relatedFrameworks, "framework")}
      </div>

      <div class="related">
        <h3>Related Policies</h3>
        ${renderCard("policies", relatedPolicies, "policy")}
      </div>

      <div class="related">
        <h3>Related Controls</h3>
        ${renderCard("controls", relatedControls, "control")}
      </div>
    </section>
  `;
};

const renderResults = (matches) => {
  if (!matches.length) {
    resultsEl.innerHTML = "<p class=\"empty\">No matches found. Try a different term.</p>";
    return;
  }

  resultsEl.innerHTML = matches
    .map((match, index) => renderResult(match.item, match.type, index))
    .join("");
};

const runSearch = () => {
  const query = queryInput.value;
  if (!query.trim()) {
    resultsEl.innerHTML = "<p class=\"empty\">Enter a search term to see related mappings.</p>";
    return;
  }

  const frameworkMatches = getMatches(state.data.frameworks, query).map((item) => ({
    type: "framework",
    item,
  }));
  const policyMatches = getMatches(state.data.policies, query).map((item) => ({
    type: "policy",
    item,
  }));
  const controlMatches = getMatches(state.data.controls, query).map((item) => ({
    type: "control",
    item,
  }));

  renderResults([...frameworkMatches, ...policyMatches, ...controlMatches]);
};

fetch("../data/knowledge_base.json")
  .then((response) => response.json())
  .then((data) => {
    state.data = data;
  })
  .catch(() => {
    resultsEl.innerHTML = "<p class=\"empty\">Failed to load data.</p>";
  });

searchBtn.addEventListener("click", runSearch);
queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});
