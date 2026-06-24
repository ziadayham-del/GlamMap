document.getElementById("providerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        business_name: document.getElementById("business_name").value,
        provider_type: "salon",
        owner_name: document.getElementById("owner_name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        password: "123456",
        city: document.getElementById("city").value,
        area: "Default",
        address: "Default Address"
    };

    const res = await fetch("/api/providers/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    console.log(result);
});