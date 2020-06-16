/**
 * Класс Calendar. Формирует календарь на год или на месяц с версткой CSS Grid Layout.
 *
 * @author    andrey-tech
 * @copyright 2019-2020 andrey-tech
 * @see https://github.com/andrey-tech/calendar-js
 * @license MIT
 *
 * @version 3.1.0
 *
 * v1.0.0 (24.04.2019) Начальная версия.
 * v2.0.0 (11.01.2020) Перенос класса в модуль. Изменение названий методов
 * v2.1.0 (16.01.2020) Добавление дней предыдущего и следующего месяца в отображение месяца
 * v2.2.0 (17.01.2020) Добавлен параметр showNextPrevDays
 * v3.0.0 (04.06.2020) Переход на CSS Grid
 * v3.1.0 (16.06.2020) Добавлен параметр showMonthTitleYear
 *
 */

class Calendar {

    /**
     * Конструктор
     * @param {number} fullYear Четырёхзначный номер года. Если не номер года не передан, то используется текущий год.
     */
    constructor (fullYear) {

        /**
         * Включает отображение заголовка года
         * @type {boolean}
         */
        this.showYearTitle = false;

        /**
         * Включает отображение заголовка месяца
         * @type {boolean}
         */
        this.showMonthTitle = true;

        /**
         * Включает отображение года в заголовке месяца
         * @type {boolean}
         */
        this.showMonthTitleYear = true;

        /**
         * Включает отображение дат из последующего и предыдущего месяца в текущем месяце
         * @type {boolean}
         */
        this.showNextPrevDays = true;

        // Текстовое представление месяца и дня недели
        this.localization = {
            month : [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
            wday  : [ "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс" ]
        };

        // Устанавливаем переданный или текущий год
        this.year = fullYear || new Date().getFullYear();
        
        // Устанавливам распределение дат по дням недели в каждом месяце года
        this.dates = this.getYearDates();
    }

    /**
     * Возвращает распределение дат по дням недели в каждом месяце года
     */
    getYearDates() {
        let dates = {},
            date = new Date('01/01/' + this.year);
        while (date.getFullYear() == this.year){
            let m = date.getMonth(),
                d = date.getDate(),
                w = date.getDay();

            if (dates[m] === undefined) {
                dates[m] = {};
            }

            dates[m][d] = w;
            date.setTime(date.getTime() + 3600*24*1000);
        }

        return dates;
    }

    /**
     * Возвращает HTML представление года
     */
    getYearHTML() {
        let $wrapper = $(`<div class="neuro-calendar-year-wrapper"/>`);

        if (this.showYearTitle) {
            $wrapper.append(`<div class="neuro-calendar-year-title">${this.year}</div>`);
        }

        for (let month of [...Array(12).keys()]) {
            let $month = this.getMonthHTML(month);
            $wrapper.append($month);
        }
        return $wrapper;
    }

    /**
     * Возвращает HTML представление месяца
     * @param {number} month Номер месяца. Нумерация месяцев начинается с нуля для первого месяца в году. Если не месяц не передан, то используется текущий месяц.
     */
    getMonthHTML(month) {

        if (typeof(month) == 'undefined') {
            month = new Date().getMonth();
        }

        let $wrapper = $(`<div class="neuro-calendar-month-wrapper"/>`),
            $grid = $(`<div class="neuro-calendar-month"/>`);

        if (this.showMonthTitle) {
            let monthTitle = this.localization.month[month] + (this.showMonthTitleYear ? ` ${this.year}` : '');
            $wrapper.append(`<div class="neuro-calendar-month-title">${monthTitle}</div>`);
        }
        
        $grid.append(this.localization.wday.map(wday => `<div class="wday">${wday}</div>`).join(''));

        let $days = this.getMonthDays(this.dates[month], month);
        this.fillMonthPrevNextDays($days, true);
        this.fillMonthPrevNextDays($days, false);

        let totalNextDays = $days.filter('div.next').length;
        if (totalNextDays >= 7) {
            $days = $days.filter(function() {
                return $(this).index() < $days.length - 7;
            });
        }

        $grid.append($days);
        $wrapper.append($grid);

        return $wrapper;
    }

    /**
     * Возвращает представление всех дней в текущем месяце
     */
    getMonthDays(dates, month) {

        let $days = $(Array(6*7).fill('<div/>').join('')),
            offset = dates[1] === 0 ? 5 : dates[1] - 2;

        for (let day in dates){
            let wday = dates[ day ],
                $mday = $(`<div class="day-number">${day}</div>`);
                
            $days.eq(+day + offset)
                .attr({
                    'data-day'      : day,
                    'data-month'    : month,
                    'data-year'     : this.year,
                    'data-wday'     : wday,
                    'data-iso-date' : this.getISODate(day, month, this.year)
                })
                .addClass('current' + ((wday == 6 || wday == 0) ? ' holiday' : ''))
                .append($mday);
        }

        this.markToday($days);

        return $days;
    }

    /**
     * Возвращает представление всех дней прошлого и следующего месяца в текущем месяце
     */
    fillMonthPrevNextDays($days, isPrev) {
        let $day;
        if (isPrev) {
            $day = $days.filter('div.current, div.previous').first();
            if (! $day.prev('div').length) {
                return;
            }
        } else {
            $day = $days.filter('div.current, div.next').last();
            if (! $day.next('div').length) {
                return;
            }
        }

        let day = this.pad($day.attr('data-day')),
            month = this.pad(+$day.attr('data-month') + 1),
            year = $day.attr('data-year'),
            date = new Date(`${year}-${month}-${day}`),
            time = date.getTime();

        if (isPrev) {
            time -= 3600*24*1000;
        } else {
            time += 3600*24*1000;
        }

        date.setTime(time);
        day = date.getDate();
        month = date.getMonth();
        year = date.getFullYear();

        if (isPrev) {
            $day = $day.prev('div').addClass('previous');
        } else {
            $day = $day.next('div').addClass('next');
        }

        let wday = date.getDay();
        if (wday == 6 || wday == 0) {
            $day.addClass('holiday');
        }

        $day.attr({
            'data-day'      : day,
            'data-month'    : month,
            'data-year'     : year,
            'data-wday'     : wday,
            'data-iso-date' : this.getISODate(day, month, year)
        })

        if (this.showNextPrevDays) {
            $day.append(`<div class="day-number">${day}</div>`);
        }

        this.fillMonthPrevNextDays($days, isPrev);
    }

    /**
     * Отмечает сегодняшний день
     */
    markToday($days) {
        let nowDate = new Date(),
            year = nowDate.getFullYear(),
            month = nowDate.getMonth(),
            day = nowDate.getDate();
        $days.filter(`div[data-year="${year}"][data-month="${month}"][data-day="${day}"]`).addClass('today');
    }

    /**
     * Возвращает дату в формате ISO
     */
    getISODate(day, month, year) {
        return `${year}-${this.pad(+month + 1)}-${this.pad(day)}`;
    }

    /**
     * Выполняет преобразование: '1' => '01'
     */
    pad(n) {
        return n < 10 ? '0' + n : n;
    }
}
