import log_raw from "./log.json" with { type: "json" };

type Log = {
    timezone: string;
    days: Days;
};

type Days = Record<string, Day[]>;

type Day = {
    time: string;
    message: string;
};

async function build() {
    const src_path = new URL(".", import.meta.url).pathname;
    Deno.chdir(src_path);

    await Deno.stat("../www").catch(() => Deno.mkdir("../www"));

    const log: Log = log_raw;
    const template = await Deno.readTextFile("./assets/template.html");

    const message = determineMessage(log);
    const history_html = assembleHistory(log.days);
    const version = await determineVersion(message);

    const output = template
        .replace("{{ message }}", message)
        .replace("{{ history }}", history_html)
        .replace("{{ version }}", version);

    await Deno.writeTextFile("../www/index.html", output);
    await Deno.copyFile("./assets/styles.css", "../www/styles.css");
}

function determineMessage(log: Log) {
    // get current day in log timezone
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: log.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(now);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    const current_day = `${year}-${month}-${day}`;

    // determine how many entries exist for current day
    const day_entries = log.days[current_day];
    let num_entries = 0;
    if (day_entries) num_entries = day_entries.length;

    // determine if current day is a weekend
    let weekend = false;
    const day_of_week = now.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: log.timezone,
    });
    if (day_of_week === "Saturday" || day_of_week === "Sunday") {
        weekend = true;
    }

    // determine message
    if (num_entries > 1) {
        return `yes, multiple (${num_entries})`;
    } else if (num_entries === 1) {
        return "yes";
    } else {
        if (weekend) {
            return "no, it's the weekend";
        } else {
            return "no";
        }
    }
}

function assembleHistory(days: Days) {
    // sort days by reverse chronological order
    const sorted_days = Object.keys(days).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
    });

    let history_html = "<ul>\n";

    for (const day of sorted_days) {
        // convert day to more readable format
        const [year, month, date] = day.split("-").map(Number);
        const date_obj = new Date(year, month - 1, date);
        const options: Intl.DateTimeFormatOptions = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        };
        const day_str = date_obj.toLocaleDateString("en-US", options)
            .toLowerCase();

        history_html += `<li><h3>${day_str}</h3>\n<ul>\n`;

        // sort entries by time
        const day_entries = days[day];
        day_entries.sort((a, b) => {
            return a.time.localeCompare(b.time);
        });

        for (const entry of day_entries) {
            // convert time to 12-hour format
            const [hour, minute] = entry.time.split(":").map(Number);
            const ampm = hour >= 12 ? "pm" : "am";
            const hour_12 = hour % 12 === 0 ? 12 : hour % 12;
            const time_12 = `${hour_12}:${
                minute.toString().padStart(2, "0")
            } ${ampm}`;

            history_html +=
                `<li><strong>${time_12}</strong>: ${entry.message}</li>\n`;
        }

        history_html += `</ul></li>\n`;
    }

    history_html += "</ul>\n";

    return history_html;
}

async function determineVersion(message: string) {
    const version = message.includes("yes") ? "y" : "n";

    if (version === "y") {
        await Deno.copyFile("./assets/favicons/yes.svg", "../www/favicon.svg");
    } else {
        await Deno.copyFile("./assets/favicons/no.svg", "../www/favicon.svg");
    }

    return version;
}

build();
