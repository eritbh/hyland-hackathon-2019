/* globals Vue, CodeMirror */
'use strict';

Vue.component('gists-sidebar', {
	props: {
		username: String,
	},
	data () {
		return {
			loaded: false,
			gists: [],
			selectedGistId: null,
			selectedFilename: null,
		};
	},
	computed: {
		selectedGist () {
			return this.gists.find(gist => gist.id === this.selectedGistId);
		},
		selectedFile () {
			if (!this.selectedGist) return null;
			return this.selectedGist.files[this.selectedFilename];
		}
	},
	methods: {
		fetchGists () {
			this.loaded = false;
			return fetch('/api/gists').then(res => {
				this.loaded = true;
				return res;
			}).then(res => res.ok && res.json()).then(data => {
				this.gists = data || [];
			});
		},
		name (gist) {
			// Return filename of the first file (TODO)
			return gist.description || Object.keys(gist.files)[0] || '<no content>';
		},
		selectGist (gistId) {
			this.selectedGistId = gistId;
			this.selectedFilename = null;
		},
		selectFile (filename) {
			this.selectedFilename = filename;
			this.$emit('change', this.selectedGist, this.selectedFile);
		},
		icon (filename) {
			return /\.(md|markdown)$/.test(filename) ? 'fa-book' : /\.(rb|js|py)$/.test(filename) ? 'fa-code' : 'fa-file';
		},
		display (filename) {
			return filename.replace(/\.md$/, '');
		},
		date (gist) {
			return new Date(gist.updated_at).toLocaleString();
		},
		remove (filename) {
			if (confirm(`The file ${filename} will be removed from this gist. Are you sure?`)) {
				fetch(`/api/gist/${this.selectedGistId}`, {
					method: 'PATCH',
					body: JSON.stringify({
						files: {
							[filename]: null,
						},
					}),
				}).then(res => {
					if (!res.ok) return;
					Vue.delete(this.selectedGist.files, filename);
					if (this.selectedFilename === filename) {
						this.selectFile(null);
					}
				});
			}
		},
		rename (filename) {
			let newName = prompt("Enter the file's new name", filename);
			if (newName == null || newName === filename) return;
			fetch(`/api/gist/${this.selectedGistId}`, {
				method: 'PATCH',
				body: JSON.stringify({
					files: {
						[filename]: {
							filename: newName,
						},
					},
				}),
			}).then(res => {
				if (!res.ok) return;
				const fileObj = this.selectedGist.files[filename];
				fileObj.filename = newName;
				Vue.delete(this.selectedGist.files, filename);
				Vue.set(this.selectedGist.files, newName, fileObj);
				if (this.selectedFilename === filename) {
					this.selectFile(newName);
				}
			});
		},
		createFileOrGist () {
			if (this.selectedGist) {
				this.createFile();
			} else {
				this.createGist();
			}
		},
		createFile () {
			let filename = prompt('What should the file be called?', '');
			if (!filename) return;
			fetch(`/api/gist/${this.selectedGistId}`, {
				method: 'PATCH',
				body: JSON.stringify({
					files: {
						[filename]: {
							content: 'New File',
						},
					},
				}),
			}).then(res => {
				if (!res.ok) return;
				this.fetchGists().then(() => {
					this.selectFile(filename);
				});
			});
		},
		createGist () {
			const newDescription = prompt("Description for the new gist?", "");
			if (newDescription == null) return;
			fetch('/api/gist', {
				method: 'POST',
				body: JSON.stringify({
					description: newDescription,
					files: {
						'README.md': {
							content: 'New Gist'
						}
					}
				})
			}).then(res => res.ok && res.json()).then(data => {
				if (!data) return;
				this.fetchGists();
			})
		},
		renameGist (gistId) {
			const newDescription = prompt('New description for the gist?', '');
			if (!newDescription) return;
			fetch(`/api/gist/${gistId}`, {
				method: 'PATCH',
				body: JSON.stringify({
					description: newDescription,
				}),
			}).then(res => res.ok && res.json()).then(data => {
				if (!data) return;
				this.fetchGists();
			});
		},
		removeGist (gistId) {
			if (!confirm('This gist will be removed permanently! Are you sure?')) return;
			fetch(`/api/gists/${gistId}`, {
				method: 'DELETE',
			}).then(res => {
				if (!res.ok) return;
				this.fetchGists();
			})
		},
	},
	template: `
		<div class="gists-sidebar">
			<div class="loading" v-if="!loaded">
				Loading...
			</div>
			<template v-else>
				<h1 class="header">
					<button
						class="back"
						v-if="selectedGist"
						@click="selectGist(null)"
						title="Back to list of gists"
					>
						<i class="fas fa-fw fa-arrow-left"/>
					</button>
					{{selectedGist ? 'Files' : 'My Gists'}}
					<button
						class="new"
						@click="createFileOrGist"
						:title="selectedGist ? 'Create new file' : 'Create new gist'"
					>
						<i class="fas fa-fw fa-plus"/>
					</button>
				</h1>
				<ul class="files-list" v-if="selectedGist">
					<li class="gist-name">{{name(selectedGist)}}</li>
					<li
						v-for="file, filename in selectedGist.files"
						:key="filename"
						:class="['file-item', {active: filename === selectedFilename}]"
						@click="selectFile(filename)"
					>
						<i :class="['fas fa-fw', icon(filename)]"/>
						{{display(filename)}}
						<span class="buttons">
							<button @click.stop="rename(filename)" title="Rename file"><i class="fas fa-fw fa-pencil-alt"/></button>
							<button @click.stop="remove(filename)" title="Delete file"><i class="fas fa-fw fa-times"/></button>
						</span>
					</li>
				</ul>
				<ul class="gists-list" v-else>
					<li
						v-for="gist in gists"
						:key="gist.id"
						class="gist-item"
						@click="selectGist(gist.id)"
					>
						<span class="name">{{name(gist)}}</span>
						<small class="updated">{{date(gist)}}</small>
						<span class="buttons">
							<button @click.stop="renameGist(gist.id)" title="Rename gist"><i class="fas fa-fw fa-pencil-alt"/></button>
							<button @click.stop="removeGist(gist.id)" title="Delete gist"><i class="fas fa-fw fa-times"/></button>
						</span>
					</li>
				</ul>
			</template>
		</div>
	`,
	mounted () {
		this.fetchGists()
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
				<a :href="'https://gist.github.com/'+user.login" title="View on gist.github.com" target="_blank">
					<div class="user">
						<img
							:src="user.avatar_url"
							width="32"
							height="32"
						/>
						{{user.login}}
					</div>
				</a>
				<div class="controls">
					<button @click="$emit('darkToggle')" title="Dark theme">
						<i class="fas fa-fw fa-moon"/>
					</button>
					<button @click="logout" title="Log out">
						<i class="fas fa-fw fa-sign-out-alt"/>
					</button>
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
	methods: {
		logout () {
			window.location.href = "/logout";
		},
	},
	mounted () {
		fetch('/api/me').then(res => {
			this.loaded = true;
			return res;
		}).then(res => res.ok && res.json()).then(data => {
			this.user = data || null;
		});
	},
});

Vue.component('code-runner', {
	props: {
		source: String,
		language: String,
		filename: String, // only used for clearing output on file change
		dark: Boolean,
	},
	data () {
		return {
			result: 'Hit the "Run" button to see the result.',
			running: false,
			codemirrorInstance: null,
			collapsed: false,
		};
	},
	computed: {
		url () {
			switch (this.language) {
				case 'Python':
					return `https://hook.io/geo1088/py-exec-then-eval?code=${encodeURIComponent(this.source)}`;
				case 'JavaScript':
					return `https://hook.io/geo1088/js-eval?code=${encodeURIComponent(this.source)}`;
				case 'Ruby':
					return `https://hook.io/geo1088/ruby-eval?code=${encodeURIComponent(this.source)}`;
			}
		},
		paneText () {
			return this.running ? 'Running...' : this.result;
		},
	},
	methods: {
		run () {
			this.running = true;
			fetch(this.url).then(res => res.text()).then(text => {
				this.result = text
					// strip first and last lines (fenced code blocks)
					.replace(/.*?\n/, '')
					.replace(/\n.*?(\n?)$/, '$1'); // preserves trailing newline
				this.running = false;
			})
		}
	},
	watch: {
		paneText (newText) {
			this.codemirrorInstance.getDoc().setValue(newText);
		},
		language (newLanguage) {
			this.codemirrorInstance.setOption('mode', newLanguage.toLowerCase())
		},
		filename () {
			this.result = 'Hit the "Run" button to see the result.';
		},
		dark (dark) {
			this.codemirrorInstance.setOption('theme', dark ? 'darcula' : 'default');
		},
	},
	template: `
		<div :class="['code-runner', {collapsed}]">
			<div class="buttons" @dblclick="collapsed = !collapsed">
				<button @click="collapsed = !collapsed" :title="collapsed ? 'Expand output' : 'Collapse output'">
					<i :class="['fas fa-fw fa-angle-down', {'fa-flip-vertical': collapsed}]"/>
				</button>
				<button class="run" @click="run" title="Run" v-if="!collapsed">
					<i class="fas fa-fw fa-arrow-alt-circle-right"/>
				</button>
				<span class="label">Output</span>
			</div>
			<textarea id="output-textarea" disabled/>
		</div>
	`,
	mounted () {
		this.codemirrorInstance = CodeMirror.fromTextArea(document.getElementById('output-textarea'), {
			mode: this.language.toLowerCase(),
			lineWrapping: true,
			lineNumbers: false,
			readOnly: true,
			cursorBlinkRate: -1,
			theme: this.dark ? 'darcula' : 'default'
		});
		this.codemirrorInstance.getDoc().setValue(this.paneText);
	},
})

Vue.component('editor-pane', {
	props: {
		file: Object,
		saveEnabled: Boolean,
		dark: Boolean,
	},
	data () {
		return {
			loaded: true,
			contents: '',
			codemirrorInstance: null,
			extraStyles: true,
			useCodeEditorForMarkdown: false,
		};
	},
	computed: {
		hasRunner () {
			return this.file && [
				'JavaScript',
				'Python',
				'Ruby',
			].includes(this.file.language);
		},
	},
	template: `
		<div :class="['editor-pane', {'extra-styles': extraStyles, 'has-runner': hasRunner, 'markdown': file && file.language === 'Markdown'}]">
			<div class="pane-content">
				<div class="markdown-toolbar">
					<button
						@click="$emit('toggleList')"
						class="listToggle"
						title="Toggle gist list"
					>
						<i class="fas fa-fw fa-bars"/>
					</button>
					<button
						@click="$emit('save')"
						:disabled="!saveEnabled"
						title="Save current file"
					>
						<i :class="['fas fa-fw', saveEnabled ? 'fa-save' : 'fa-circle-notch fa-spin']"/>
					</button>
					<div class="label">{{file ? file.filename : ''}}</div>
				</div>
				<textarea
					class="code-area"
					id="main-textarea"
				/>
			</div>
			<code-runner
				v-if="hasRunner"
				:source="contents"
				:language="file.language"
				:filename="file.filename"
				:dark="dark"
			/>
			<!-- Overlays -->
			<div class="loading" v-if="!loaded">
				Loading...
			</div>
			<div class="no-file" v-else-if="!file">
				<div class="inner" align="center">
					<h2>No file selected</h2>
					<p>Use the sidebar on the left to navigate and create gists</p>
				</div>
			</div>
		</div>
	`,
	watch: {
		file (newFile) {
			if (!newFile) return;
			this.loaded = false;
			fetch(newFile.raw_url).then(res => {
				this.loaded = true;
				return res;
			}).then(res => res.ok && res.text()).then(text => {
				this.updateContents(text || '');
				this.updateCMSettings();
			});
		},
		dark (dark) {
			this.codemirrorInstance.setOption('theme', dark ? 'darcula' : 'default');
		},
	},
	methods: {
		updateContents (contents) {
			this.contents = contents;
			this.codemirrorInstance.getDoc().setValue(contents);
			this.$emit('initialValue', contents);
		},
		updateCMSettings () {
			if (!this.file) return;
			switch (this.useCodeEditorForMarkdown ? null : this.file.language) {
				case 'Markdown':
					this.codemirrorInstance.setOption('mode', 'gfm');
					this.codemirrorInstance.setOption('lineNumbers', false);
					this.codemirrorInstance.setOption('lineWrapping', true);
					break;
				case 'JavaScript':
				case 'Python':
				case 'Ruby':
					this.codemirrorInstance.setOption('mode', this.file.language.toLowerCase());
					this.codemirrorInstance.setOption('lineNumbers', true);
					this.codemirrorInstance.setOption('lineWrapping', false);
					break;
				case 'Text':
				case null: // Plain text probably
					this.codemirrorInstance.setOption('mode', null);
					this.codemirrorInstance.setOption('lineNumbers', false);
					this.codemirrorInstance.setOption('lineWrapping', true);
					break;
				default:
					this.codemirrorInstance.setOption('mode', null);
					this.codemirrorInstance.setOption('lineNumbers', true);
					this.codemirrorInstance.setOption('lineWrapping', false);
			}
		},
	},
	mounted () {
		this.codemirrorInstance = CodeMirror.fromTextArea(document.getElementById('main-textarea'), {
			lineNumbers: true,
		});
		this.codemirrorInstance.on('change', () => {
			this.contents = this.codemirrorInstance.getDoc().getValue();
			this.$emit('change', this.contents);
		});
		// TODO: load settings from localstorage
	},
});

// Create the main Vue instance
const app = new Vue({
	el: '#app',
	data: {
		user: null,
		loaded: false,
		currentGist: null,
		currentFile: null,
		fileContents: null,
		contentsChanged: false,
		saveEnabled: true,
		darkTheme: false,
		sidebarHidden: false,
	},
	template: `
		<div :class="['app', {dark: darkTheme, 'sidebar-hidden': sidebarHidden}]">
			<user-preview
				@darkToggle="darkTheme = !darkTheme"
			/>
			<gists-sidebar
				@change="fileUpdate"
			/>
			<editor-pane
				:file="currentFile"
				:saveEnabled="saveEnabled"
				:dark="darkTheme"
				@toggleList="sidebarHidden = !sidebarHidden"
				@change="fileContentsUpdated"
				@initialValue="fileContentsInitial"
				@save="save"
			/>
		</div>
	`,
	methods: {
		fileUpdate (gist, file) {
			this.currentFile = file;
			this.currentGist = gist;
		},
		fileContentsUpdated (contents) {
			this.fileContents = contents;
			this.contentsChanged = true;
		},
		fileContentsInitial (contents) {
			this.fileContents = contents;
			this.contentsChanged = false;
		},
		save () {
			this.saveEnabled = false;
			fetch(`/api/gist/${this.currentGist.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					files: {
						[this.currentFile.filename]: {
							content: this.fileContents,
						},
					},
				}),
			}).then(res => {
				this.contentsChanged = false;
				this.saveEnabled = true;
			});
		},
	},
});

window.onbeforeunload = function () {
	if (app.contentsChanged) {
		return "You have unsaved changes, are you sure you want to leave?"
	}
};
