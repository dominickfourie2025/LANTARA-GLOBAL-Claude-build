/* =========================================
   LANTARA GLOBAL - SCRIPT.JS V1.0
========================================= */

// 1. Initialize Supabase
const SUPABASE_URL = 'https://kbrebymkkmaxehywjwkp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lAh3iNo60ROS9zyKwJgPSg_LK5Sy81k';

// Create Supabase client (using global CDN library)
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Lantara Global: Supabase connected.");

// 2. Fetch and display active jobs
async function loadActiveJobs() {
    const jobGrid = document.getElementById('job-grid');
    if (!jobGrid) return;

    // Fetch jobs where is_active is true
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error("Error fetching jobs:", error);
        jobGrid.innerHTML = `<p class="text-center" style="color:red;">Unable to load jobs at this time.</p>`;
        return;
    }

    if (!jobs || jobs.length === 0) {
        jobGrid.innerHTML = `<p class="text-center" style="color:var(--neutral-600);">No active jobs available right now.</p>`;
        return;
    }

    // Clear the placeholder HTML if we are loading dynamically
    jobGrid.innerHTML = '';

    // Loop through jobs and generate HTML
    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="icon-circle">🏫</div>
                <span class="category-badge ${getCategoryClass(job.category)}">${job.category}</span>
            </div>
            <h3 class="job-title">${job.title}</h3>
            <div class="job-location">📍 ${job.city} <span style="background:#f3f4f6;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.8rem;">${job.tier || ''}</span></div>
            <div class="job-salary">${job.salary_min ? job.salary_min.toLocaleString() : ''} – ${job.salary_max ? job.salary_max.toLocaleString() : ''} RMB/month</div>
            <div class="benefits-list">
                ${job.highlights && job.highlights.length > 0 ? job.highlights.map(h => `<span class="benefit-tag">${h}</span>`).join('') : ''}
            </div>
            <p class="job-desc">${job.description}</p>
            <div class="card-actions">
                <a href="jobs.html?id=${job.id}" class="btn-outline">View Details</a>
                <a href="#" onclick="handleApply('${job.id}')" class="btn-apply">Apply Now</a>
            </div>
        `;
        jobGrid.appendChild(card);
    });
}

// Helper to style badges based on category
function getCategoryClass(category) {
    const map = {
        'Public School': 'public',
        'Kindergarten': 'kinder',
        'Language Centre': 'language',
        'International School': 'international',
        'Bilingual School': 'international'
    };
    return map[category] || '';
}

// 3. Handle Apply Button Logic (Check for user session)
async function handleApply(jobId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // User is logged in - proceed to application logic
        alert(`Proceeding to apply for Job ID: ${jobId}. (Backend logic to insert into applications table pending).`);
        // Redirect to a job details page or submit application here
    } else {
        // User is NOT logged in - redirect to sign up (Prompt Page 7)
        window.location.href = 'teacher-signup.html';
    }
}

// 4. Run the loader when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadActiveJobs();
});
