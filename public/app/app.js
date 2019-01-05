/* global Vue */
'use strict';

Vue.component('gists-sidebar', {
	props: {
		username: String,
	},
	data () {
		return {
			gists: [],
		};
	},
	methods: {
		name (gist) {
			// Return filename of the first file (TODO)
			return Object.keys(gist.files)[0];
		}
	},
	template: `
		<div class="gists-sidebar">
			<ul class="gists-list">
				<h1>My Gists</h1>
				<li
					v-for="gist in gists"
					:key="gist.id"
					class="gist-item"
				>
					{{name(gist)}}
				</li>
			</ul>
		</div>
	`,
	mounted () {
		console.log('mounted')
		fetch('/api/gists').then(res => res.json()).then(data => {
			this.gists = data;
		})
	},
});

Vue.component('user-preview', {
	data () {
		return {
			loaded: false,
			user: null,
		};
	},
	template: `
		<div class="user-preview">
			<template v-if="!loaded">
				Loading...
			</template>
			<template v-else-if="user">
				<img
					:src="user.avatar_url"
					width="32"
					height="32"
				/>
				<div class="text">
					Logged in as {{user.login}}<br>
					<a href="/logout">Log Out</a>
				</div>
			</template>
			<template v-else>
				<div class="text">
					Not logged in<br>
					<a href="/auth/github">Log in with Github</a>
				</div>
			</template>
		</div>
	`,
	mounted () {
		fetch('/api/me').then(res => res.json()).then(data => {
			this.user = data;
			this.loaded = true;
		}).catch(err => {
			this.loaded = true;
		})
	},
})

Vue.component('markdown-toolbar', {
	template: `
		<div class="markdown-toolbar">
			Toolbar
		</div>
	`
})

Vue.component('editor-pane', {
	template: `
		<div class="editor-pane">
			Editor
		</div>
	`
})

// Create the main Vue instance
new Vue({
	el: '#app',
	data: {
		user: null,
		loaded: false,
	},
	template: `
		<div class="app">
			<user-preview/>
			<gists-sidebar username="geo1088"/>
			<markdown-toolbar/>
			<editor-pane/>
		</div>
	`,
});
