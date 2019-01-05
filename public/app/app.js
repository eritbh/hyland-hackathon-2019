/* global Vue */
'use strict';

Vue.component('gists-list', {
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
		<div class="gists-list">
			<ul>
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
				Logged in as {{user.name}}
			</template>
			<template v-else>
				Not logged in - <a href="/auth/github">Log in with Github</a>
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
			<gists-list username="geo1088"/>
		</div>
	`,
});
