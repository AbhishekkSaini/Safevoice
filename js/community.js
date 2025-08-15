// Community functionality
import { getCommunityPosts, createCommunityPost, addComment, getCurrentUser, showNotification } from './supabase-client.js';

// Initialize community handlers
document.addEventListener('DOMContentLoaded', () => {
    initializeCommunityHandlers();
    loadCommunityPosts();
});

function initializeCommunityHandlers() {
    // Add post button
    const addPostBtn = document.getElementById('addPostBtn');
    if (addPostBtn) {
        addPostBtn.addEventListener('click', showCreatePostModal);
    }
    
    // Community post form
    const communityPostForm = document.getElementById('communityPostForm');
    if (communityPostForm) {
        communityPostForm.addEventListener('submit', handleCreatePost);
    }
}

function showCreatePostModal() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please log in to create posts', 'warning');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-lg mx-4 w-full animate__animated animate__zoomIn">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Create Community Post</h2>
                <button onclick="closeCreatePostModal()" class="text-gray-500 hover:text-gray-700">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <form id="createPostForm" class="space-y-4">
                <div>
                    <label for="postTitle" class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input type="text" id="postTitle" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="What's happening in your community?">
                </div>
                
                <div>
                    <label for="postType" class="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                    <select id="postType" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <option value="general">General</option>
                        <option value="safety_tip">Safety Tip</option>
                        <option value="alert">Community Alert</option>
                        <option value="help_request">Help Request</option>
                        <option value="announcement">Announcement</option>
                    </select>
                </div>
                
                <div>
                    <label for="postContent" class="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea id="postContent" required rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none" placeholder="Share details with your community..."></textarea>
                </div>
                
                <div>
                    <label for="postLocation" class="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                    <input type="text" id="postLocation" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="e.g., Downtown, Main Street">
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="isUrgent" class="rounded border-gray-300 text-orange-500 focus:ring-orange-500">
                    <label for="isUrgent" class="ml-2 text-sm text-gray-600">Mark as urgent</label>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all">
                        Create Post
                    </button>
                    <button type="button" onclick="closeCreatePostModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Add form handler
    const form = modal.querySelector('#createPostForm');
    form.addEventListener('submit', handleCreatePost);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCreatePostModal();
        }
    });
}

// Make function global for onclick handler
window.closeCreatePostModal = function() {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    if (modal) {
        modal.remove();
    }
};

async function handleCreatePost(e) {
    e.preventDefault();
    
    const form = e.target;
    const title = form.postTitle.value;
    const content = form.postContent.value;
    const postType = form.postType.value;
    const location = form.postLocation.value;
    const isUrgent = form.isUrgent.checked;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;
    
    try {
        const postData = {
            title,
            content,
            post_type: postType,
            location,
            is_urgent: isUrgent
        };
        
        const { data, error } = await createCommunityPost(postData);
        
        if (error) {
            throw error;
        }
        
        showNotification('Post created successfully!', 'success');
        closeCreatePostModal();
        
        // Reload community posts
        loadCommunityPosts();
        
    } catch (error) {
        console.error('Error creating post:', error);
        showNotification('Failed to create post', 'error');
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function loadCommunityPosts() {
    try {
        const { data: posts, error } = await getCommunityPosts();
        
        if (error) {
            console.error('Error loading community posts:', error);
            return;
        }
        
        displayCommunityPosts(posts);
        
    } catch (error) {
        console.error('Error loading community posts:', error);
    }
}

function displayCommunityPosts(posts) {
    const communitySection = document.getElementById('communityPosts');
    if (!communitySection) return;
    
    if (posts.length === 0) {
        communitySection.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="message-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                <p class="text-gray-500">Be the first to share something with your community!</p>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        return;
    }
    
    const postsHTML = posts.map(post => {
        const authorName = post.profiles ? 
            `${post.profiles.first_name} ${post.profiles.last_name}`.trim() : 
            'Anonymous';
        
        const postTypeColors = {
            'general': 'bg-blue-100 text-blue-800',
            'safety_tip': 'bg-green-100 text-green-800',
            'alert': 'bg-red-100 text-red-800',
            'help_request': 'bg-yellow-100 text-yellow-800',
            'announcement': 'bg-purple-100 text-purple-800'
        };
        
        const typeColor = postTypeColors[post.post_type] || 'bg-gray-100 text-gray-800';
        const urgentBadge = post.is_urgent ? 
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">Urgent</span>' : 
            '';
        
        const commentsHTML = post.post_comments && post.post_comments.length > 0 ? 
            post.post_comments.map(comment => {
                const commentAuthor = comment.profiles ? 
                    `${comment.profiles.first_name} ${comment.profiles.last_name}`.trim() : 
                    'Anonymous';
                
                return `
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-medium text-sm text-gray-800">${commentAuthor}</span>
                            <span class="text-xs text-gray-500">${formatDate(comment.created_at)}</span>
                        </div>
                        <p class="text-sm text-gray-700">${comment.content}</p>
                    </div>
                `;
            }).join('') : '';
        
        return `
            <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-semibold text-sm">${authorName.charAt(0)}</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${authorName}</h4>
                            <p class="text-sm text-gray-500">${formatDate(post.created_at)}</p>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColor}">
                            ${post.post_type.replace('_', ' ')}
                        </span>
                        ${urgentBadge}
                    </div>
                </div>
                
                <h3 class="text-xl font-bold text-gray-800 mb-3">${post.title}</h3>
                <p class="text-gray-600 mb-4">${post.content}</p>
                
                ${post.location ? `
                    <div class="flex items-center text-sm text-gray-500 mb-4">
                        <i data-lucide="map-pin" class="w-4 h-4 mr-1"></i>
                        ${post.location}
                    </div>
                ` : ''}
                
                <div class="border-t pt-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-medium text-gray-700">
                            ${post.post_comments ? post.post_comments.length : 0} Comments
                        </span>
                        <button onclick="showCommentForm('${post.id}')" class="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            Add Comment
                        </button>
                    </div>
                    
                    <div class="space-y-3">
                        ${commentsHTML}
                    </div>
                    
                    <div id="commentForm-${post.id}" class="hidden mt-4 pt-4 border-t">
                        <textarea id="commentText-${post.id}" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none" placeholder="Add a comment..."></textarea>
                        <div class="flex justify-end space-x-2 mt-2">
                            <button onclick="hideCommentForm('${post.id}')" class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                            <button onclick="submitComment('${post.id}')" class="px-4 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">Post</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    communitySection.innerHTML = postsHTML;
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Make functions global for onclick handlers
window.showCommentForm = function(postId) {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please log in to comment', 'warning');
        return;
    }
    
    const form = document.getElementById(`commentForm-${postId}`);
    if (form) {
        form.classList.remove('hidden');
        const textarea = document.getElementById(`commentText-${postId}`);
        if (textarea) {
            textarea.focus();
        }
    }
};

window.hideCommentForm = function(postId) {
    const form = document.getElementById(`commentForm-${postId}`);
    if (form) {
        form.classList.add('hidden');
        const textarea = document.getElementById(`commentText-${postId}`);
        if (textarea) {
            textarea.value = '';
        }
    }
};

window.submitComment = async function(postId) {
    const textarea = document.getElementById(`commentText-${postId}`);
    const content = textarea.value.trim();
    
    if (!content) {
        showNotification('Please enter a comment', 'warning');
        return;
    }
    
    try {
        const { data, error } = await addComment(postId, content);
        
        if (error) {
            throw error;
        }
        
        showNotification('Comment added successfully!', 'success');
        hideCommentForm(postId);
        
        // Reload community posts
        loadCommunityPosts();
        
    } catch (error) {
        console.error('Error adding comment:', error);
        showNotification('Failed to add comment', 'error');
    }
};

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
        return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}