import each from 'lodash.foreach';
import groupBy from 'lodash.groupby';
import mapValues from 'map-values';
import browserslist from 'browserslist';


// @function parse - parse browserlist pattern to the list of browsers
// @access public
// @param {string} string - browserlist pattern to parse
// @return {object} parsed browserlist pattern
//     @property {array} parsed[browser] - array of versions for browser
//         @property {string} parsed[browser][version] - version of the browser that match the pattern
export function parse (string) {
    return mapValues(
        groupBy(
            browserslist(string).map((browser) => ({
                browser: browser.split(' ')[0],
                version: browser.split(' ')[1]
            })),
            'browser'
        ),
        (browserVersions) => browserVersions.map(
            (browserVersion) => browserVersion.version
        )
    );
}


/* @function stringify - convert settings object to Autoprefixer configuration string
 * @access public
 * @param {object} settings - settings object
 *     @property {object} [settings.popularity = undefined] - popularity matcher
 *         @property {number} settings.popularity[country | 'global'] - popularity for country or entire world
 *     @property {object} [settings.lastVersions = undefined] - last versions matcher
 *         @property {number} settings.lastVersions[browser | 'all'] - number of last version for specific browser or for all browsers
 *     @property {array} [settings.versionComparison = undefined] - older than or never than matchers
 *         @property {object} settings.versionComparison[browser] - version comparison entities for the browser
 *             @property {object} [settings.versionComparison[browser].newerThan = undefined] - newer than matcher
 *                 @property {boolean} settings.versionComparison[browser].newerThan.equal - true if greater or equal
 *                 @property {string} settings.versionComparison[browser].newerThan.version - version to compare with
 *             @property {object} [settings.versionComparison[browser].olderThan = undefined] - older than matcher
 *                 @property {boolean} settings.versionComparison[browser].olderThan.equal - true if lower or equal
 *                 @property {string} settings.versionComparison[browser].olderThan.version - version to compare with
 *     @property {array} [settings.newerThan = undefined] - newer (or equal) than matcher
 *         @property {number} settings.newerThan[browser] - browser chosen by newerThan matcher
 *     @property {array} [settings.direct = undefined] - direct matcher
 *         @property {number} settings.direct[browser] - browser chosen by direct matcher (includes ESR matcher)
 *         
 * @return {string} browserlist pattern
 */
export function stringify (settings) {
    var autoprefixerConfig = [ ];

    each(settings, function(setting, settingName) {
        switch(setting ? settingName : null) {
            case 'popularity':
                each(setting, function(popularity, country) {
                    autoprefixerConfig.push([
                        '>',
                        popularity + '%',
                        (country !== 'global' ? 'in ' + country : undefined)
                    ].filter(part => !!part).join(' '));
                });
            break;
            case 'lastVersions':
                each(setting, function(versions, browser) {
                    autoprefixerConfig.push([
                        'last',
                        versions,
                        (browser !== 'all' ? browser : undefined),
                        'versions'
                    ].filter(part => !!part).join(' '));
                });
            break;
            case 'versionComparison':
                each(setting, function(comparisons, browser) {
                    each(comparisons, function(comparison, comparisonName) {
                        autoprefixerConfig.push([
                            browser,
                            ({
                                olderThan: comparison.equal ? '<=' : '<',
                                newerThan: comparison.equal ? '>=' : '>'
                            })[comparisonName],
                            comparison.version
                        ].join(' '));
                    });
                });
            break;
            case 'direct':
                autoprefixerConfig = autoprefixerConfig.concat(setting);
            break;
            default:
        }
    });

    return autoprefixerConfig.join(',');
}